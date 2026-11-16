package com.mamelodiinitiative.viewmodel

data class MainUiState<T>(
    val data: List<T> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val isFallback: Boolean = false
)
