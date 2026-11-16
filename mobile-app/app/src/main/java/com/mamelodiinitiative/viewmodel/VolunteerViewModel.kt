package com.mamelodiinitiative.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.mamelodiinitiative.data.VolunteerRepository
import com.mamelodiinitiative.data.models.VolunteerApplication
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class VolunteerUiState(
    val application: VolunteerApplication = VolunteerApplication(),
    val existingApplication: VolunteerApplication? = null,
    val isLoading: Boolean = false,
    val isCheckingStatus: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null
)

class VolunteerViewModel(
    private val repository: VolunteerRepository = VolunteerRepository(),
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
) : ViewModel() {
    private val _uiState = MutableStateFlow(VolunteerUiState())
    val uiState: StateFlow<VolunteerUiState> = _uiState.asStateFlow()

    init {
        loadUserApplication()
    }

    fun loadUserApplication() {
        val uid = auth.currentUser?.uid ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isCheckingStatus = true)
            val result = repository.getLatestUserApplication(uid)
            val app = result.getOrNull()
            _uiState.value = _uiState.value.copy(
                existingApplication = app,
                isCheckingStatus = false
            )
        }
    }

    fun updateApplication(application: VolunteerApplication) {
        _uiState.value = _uiState.value.copy(application = application, error = null)
    }

    fun resetApplication() {
        _uiState.value = _uiState.value.copy(
            application = VolunteerApplication(),
            isLoading = false,
            isSuccess = false,
            error = null
        )
        loadUserApplication()
    }

    fun submitApplication() {
        if (_uiState.value.isLoading) return

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = repository.submitApplication(_uiState.value.application)
            _uiState.value = result.fold(
                onSuccess = {
                    val submitted = _uiState.value.application
                    _uiState.value.copy(
                        isLoading = false,
                        isSuccess = true,
                        existingApplication = submitted.copy(status = "pending")
                    )
                },
                onFailure = { _uiState.value.copy(isLoading = false, error = it.localizedMessage ?: "Submission failed") }
            )
        }
    }
}
