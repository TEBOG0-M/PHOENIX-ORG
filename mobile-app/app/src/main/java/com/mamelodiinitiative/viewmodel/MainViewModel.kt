package com.mamelodiinitiative.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mamelodiinitiative.data.NewsRepository
import com.mamelodiinitiative.data.ProgrammeRepository
import com.mamelodiinitiative.data.models.NewsItem
import com.mamelodiinitiative.data.models.Programme
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MainViewModel(
    private val programmeRepository: ProgrammeRepository = ProgrammeRepository(),
    private val newsRepository: NewsRepository = NewsRepository()
) : ViewModel() {
    private val _programmesState = MutableStateFlow(MainUiState<Programme>(isLoading = true))
    val programmesState: StateFlow<MainUiState<Programme>> = _programmesState.asStateFlow()

    private val _newsState = MutableStateFlow(MainUiState<NewsItem>(isLoading = true))
    val newsState: StateFlow<MainUiState<NewsItem>> = _newsState.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _programmesState.value = programmeRepository.getProgrammes()
        }
        loadNews()
    }

    fun loadNews() {
        viewModelScope.launch {
            _newsState.value = MainUiState(isLoading = true)
            _newsState.value = newsRepository.getNews()
        }
    }
}
