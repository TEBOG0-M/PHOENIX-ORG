package com.mamelodiinitiative.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mamelodiinitiative.data.ContactRepository
import com.mamelodiinitiative.data.models.ContactMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ContactUiState(
    val message: ContactMessage = ContactMessage(),
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null
)

class ContactViewModel(
    private val repository: ContactRepository = ContactRepository()
) : ViewModel() {
    private val _uiState = MutableStateFlow(ContactUiState())
    val uiState: StateFlow<ContactUiState> = _uiState.asStateFlow()

    fun updateMessage(message: ContactMessage) {
        _uiState.value = _uiState.value.copy(message = message, error = null)
    }

    fun submitMessage(name: String, email: String, subject: String, body: String) {
        if (_uiState.value.isLoading) return
        val contactMsg = ContactMessage(
            name = name,
            email = email,
            subject = subject,
            message = body
        )
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = repository.submitMessage(contactMsg)
            _uiState.value = result.fold(
                onSuccess = { ContactUiState(isSuccess = true) },
                onFailure = { _uiState.value.copy(isLoading = false, error = it.localizedMessage ?: "Failed to send message") }
            )
        }
    }

    fun resetState() {
        _uiState.value = ContactUiState()
    }
}
