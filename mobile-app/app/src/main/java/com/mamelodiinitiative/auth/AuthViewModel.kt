package com.mamelodiinitiative.auth

import android.util.Patterns
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.mamelodiinitiative.data.models.UserProfile
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AuthUiState(
    val isLoading: Boolean = false,
    val isProfileLoading: Boolean = false,
    val user: FirebaseUser? = FirebaseAuth.getInstance().currentUser,
    val profile: UserProfile? = null,
    val message: String? = null,
    val profileError: String? = null
)

class AuthViewModel(private val repository: AuthRepository = AuthRepository()) : ViewModel() {
    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState = _uiState.asStateFlow()

    init {
        checkAndLoadProfile()
    }

    fun retryProfileLoad() {
        checkAndLoadProfile()
    }

    fun register(email: String, password: String, fullName: String) {
        val cleanEmail = email.trim()
        val cleanName = fullName.trim()
        if (cleanName.isBlank()) {
            _uiState.value = _uiState.value.copy(message = "Enter your full name.")
            return
        }
        if (!Patterns.EMAIL_ADDRESS.matcher(cleanEmail).matches()) {
            _uiState.value = _uiState.value.copy(message = "Enter a valid email address.")
            return
        }
        if (password.length < 6) {
            _uiState.value = _uiState.value.copy(message = "Password must be at least 6 characters.")
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, message = null)
            val result = repository.register(cleanEmail, password, cleanName)
            result.fold(
                onSuccess = { user ->
                    try {
                        val profile = repository.ensureUserProfile(user)
                        _uiState.value = AuthUiState(user = user, profile = profile, isLoading = false)
                    } catch (e: Exception) {
                        _uiState.value = AuthUiState(user = user, profile = null, isLoading = false, profileError = e.localizedMessage ?: "Failed to load profile.")
                    }
                },
                onFailure = {
                    _uiState.value = AuthUiState(user = repository.currentUser, message = it.friendlyMessage())
                }
            )
        }
    }

    fun signIn(email: String, password: String) {
        val cleanEmail = email.trim()
        if (!Patterns.EMAIL_ADDRESS.matcher(cleanEmail).matches()) {
            _uiState.value = _uiState.value.copy(message = "Enter a valid email address.")
            return
        }
        if (password.length < 6) {
            _uiState.value = _uiState.value.copy(message = "Password must be at least 6 characters.")
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, message = null)
            val result = repository.signIn(cleanEmail, password)
            result.fold(
                onSuccess = { user ->
                    try {
                        val profile = repository.ensureUserProfile(user)
                        _uiState.value = AuthUiState(user = user, profile = profile, isLoading = false)
                    } catch (e: Exception) {
                        _uiState.value = AuthUiState(user = user, profile = null, isLoading = false, profileError = e.localizedMessage ?: "Failed to load profile.")
                    }
                },
                onFailure = {
                    _uiState.value = AuthUiState(user = repository.currentUser, message = it.friendlyMessage())
                }
            )
        }
    }

    fun clearMessage() { _uiState.value = _uiState.value.copy(message = null) }

    fun signOut() {
        repository.signOut()
        _uiState.value = AuthUiState(user = null, profile = null)
    }

    private fun checkAndLoadProfile() {
        val user = repository.currentUser
        if (user != null) {
            viewModelScope.launch {
                _uiState.value = _uiState.value.copy(isProfileLoading = true, profileError = null)
                try {
                    val profile = repository.ensureUserProfile(user)
                    _uiState.value = _uiState.value.copy(profile = profile, isProfileLoading = false)
                } catch (e: Exception) {
                    _uiState.value = _uiState.value.copy(profile = null, isProfileLoading = false, profileError = e.localizedMessage ?: "Failed to load user profile.")
                }
            }
        }
    }
}

private fun Throwable.friendlyMessage(): String {
    val s = localizedMessage.orEmpty().lowercase()
    return when {
        "already in use" in s -> "An account already exists for this email. Try signing in."
        "invalid credential" in s || "wrong password" in s || "password is invalid" in s ->
            "Email or password is incorrect."
        "no user record" in s || "user not found" in s ->
            "No account found for this email. Register first."
        "network" in s -> "Network error. Check your connection and try again."
        "too many requests" in s -> "Too many attempts. Wait a moment before trying again."
        else -> "Authentication failed. Check your details and try again."
    }
}
