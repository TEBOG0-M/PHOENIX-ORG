package com.mamelodiinitiative.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuth.AuthStateListener
import com.google.firebase.firestore.ListenerRegistration
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
    val error: String? = null,
    val userUid: String? = null
)

class VolunteerViewModel(
    private val repository: VolunteerRepository = VolunteerRepository(),
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
) : ViewModel() {
    private val _uiState = MutableStateFlow(VolunteerUiState())
    val uiState: StateFlow<VolunteerUiState> = _uiState.asStateFlow()

    private var activeUid: String? = null
    private var applicationListener: ListenerRegistration? = null

    private val authStateListener = AuthStateListener { firebaseAuth ->
        handleUserChanged(firebaseAuth.currentUser?.uid)
    }

    init {
        auth.addAuthStateListener(authStateListener)
    }

    private fun handleUserChanged(uid: String?) {
        if (uid == activeUid) return

        activeUid = uid
        applicationListener?.remove()
        applicationListener = null

        // Never retain another account's application or unfinished form data.
        _uiState.value = VolunteerUiState(
            userUid = uid,
            isCheckingStatus = uid != null
        )

        if (uid != null) {
            loadUserApplication(uid)
        }
    }

    fun loadUserApplication() {
        val uid = auth.currentUser?.uid
        if (uid == null) {
            handleUserChanged(null)
            return
        }

        if (uid != activeUid) {
            handleUserChanged(uid)
            return
        }

        loadUserApplication(uid)
    }

    private fun loadUserApplication(uid: String) {
        applicationListener?.remove()
        _uiState.value = _uiState.value.copy(
            existingApplication = null,
            isCheckingStatus = true,
            userUid = uid
        )

        applicationListener = repository.listenToLatestUserApplication(uid) { result ->
            // Ignore snapshots from a previous account after sign-out or account switching.
            if (activeUid != uid || auth.currentUser?.uid != uid) return@listenToLatestUserApplication

            _uiState.value = _uiState.value.copy(
                existingApplication = result.getOrNull()?.takeIf { it.uid == uid },
                isCheckingStatus = false,
                error = result.exceptionOrNull()?.localizedMessage
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

        val uid = auth.currentUser?.uid
        if (uid == null || uid != activeUid) {
            _uiState.value = _uiState.value.copy(error = "Please sign in again before submitting.")
            return
        }

        val submitted = _uiState.value.application
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = repository.submitApplication(submitted)

            // Ignore completion from a session that has since signed out or changed accounts.
            if (activeUid != uid || auth.currentUser?.uid != uid) return@launch

            _uiState.value = result.fold(
                onSuccess = { applicationId ->
                    _uiState.value.copy(
                        isLoading = false,
                        isSuccess = true,
                        existingApplication = submitted.copy(
                            id = applicationId,
                            uid = uid,
                            status = "pending",
                            createdAt = java.time.Instant.now().toString()
                        )
                    )
                },
                onFailure = {
                    _uiState.value.copy(
                        isLoading = false,
                        error = it.localizedMessage ?: "Submission failed"
                    )
                }
            )
        }
    }

    override fun onCleared() {
        auth.removeAuthStateListener(authStateListener)
        applicationListener?.remove()
        applicationListener = null
        super.onCleared()
    }
}
