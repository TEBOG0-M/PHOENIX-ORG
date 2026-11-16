package com.mamelodiinitiative.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mamelodiinitiative.data.ProgrammeRepository
import com.mamelodiinitiative.data.VolunteerRepository
import com.mamelodiinitiative.data.models.Programme
import com.mamelodiinitiative.data.models.VolunteerApplication
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ManagerViewModel(
    private val volunteerRepository: VolunteerRepository = VolunteerRepository(),
    private val programmeRepository: ProgrammeRepository = ProgrammeRepository()
) : ViewModel() {
    private val _applicationsState = MutableStateFlow(MainUiState<VolunteerApplication>(isLoading = true))
    val applicationsState: StateFlow<MainUiState<VolunteerApplication>> = _applicationsState.asStateFlow()

    private val _programmesState = MutableStateFlow(MainUiState<Programme>(isLoading = true))
    val programmesState: StateFlow<MainUiState<Programme>> = _programmesState.asStateFlow()

    private val _actionStatus = MutableStateFlow<String?>(null)
    val actionStatus: StateFlow<String?> = _actionStatus.asStateFlow()

    init {
        loadManagerData()
    }

    fun loadManagerData() {
        viewModelScope.launch {
            _applicationsState.value = _applicationsState.value.copy(isLoading = true)
            val result = volunteerRepository.getAllApplications()
            result.fold(
                onSuccess = { list ->
                    _applicationsState.value = MainUiState(data = list, isLoading = false, error = null)
                },
                onFailure = { err ->
                    _applicationsState.value = MainUiState(data = emptyList(), isLoading = false, error = err.localizedMessage)
                }
            )
        }

        viewModelScope.launch {
            _programmesState.value = programmeRepository.getProgrammes()
        }
    }

    fun updateApplicationStatus(applicationId: String, newStatus: String) {
        viewModelScope.launch {
            val result = volunteerRepository.updateApplicationStatus(applicationId, newStatus)
            result.fold(
                onSuccess = {
                    _actionStatus.value = "Application status updated to $newStatus."
                    loadManagerData()
                },
                onFailure = { err ->
                    _actionStatus.value = "Failed to update status: ${err.localizedMessage}"
                }
            )
        }
    }

    fun saveProgramme(programme: Programme, onComplete: (Boolean) -> Unit) {
        viewModelScope.launch {
            val result = programmeRepository.saveProgramme(programme)
            result.fold(
                onSuccess = {
                    _actionStatus.value = "Programme saved successfully."
                    loadManagerData()
                    onComplete(true)
                },
                onFailure = { err ->
                    _actionStatus.value = "Failed to save programme: ${err.localizedMessage}"
                    onComplete(false)
                }
            )
        }
    }

    fun deleteProgramme(docId: String, onComplete: (Boolean) -> Unit = {}) {
        viewModelScope.launch {
            val result = programmeRepository.deleteProgramme(docId)
            result.fold(
                onSuccess = {
                    _actionStatus.value = "Programme deleted."
                    loadManagerData()
                    onComplete(true)
                },
                onFailure = { err ->
                    _actionStatus.value = "Failed to delete: ${err.localizedMessage}"
                    onComplete(false)
                }
            )
        }
    }

    fun clearActionStatus() {
        _actionStatus.value = null
    }
}
