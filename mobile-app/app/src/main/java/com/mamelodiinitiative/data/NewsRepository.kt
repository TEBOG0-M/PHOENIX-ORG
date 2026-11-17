package com.mamelodiinitiative.data

import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.mamelodiinitiative.data.models.NewsItem
import com.mamelodiinitiative.viewmodel.MainUiState
import kotlinx.coroutines.tasks.await

class NewsRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {
    suspend fun getNews(): MainUiState<NewsItem> = try {
        val snapshot = firestore.collection("news_articles").get().await()
        val newsItems = snapshot.documents.mapIndexedNotNull { index, document ->
            val data = document.data.orEmpty()
            val title = data["title"] as? String ?: return@mapIndexedNotNull null
            val publishedAt = data["publishedAt"] as? Timestamp
            val date = (data["date"] as? String)
                ?: (data["publishedAt"] as? String)
                ?: publishedAt?.toDate()?.toString()
                ?: (data["createdAt"] as? String)
                ?: ""

            NewsItem(
                id = (data["id"] as? Number)?.toInt() ?: index + 1,
                docId = document.id,
                title = title,
                description = data["summary"] as? String
                    ?: data["description"] as? String
                    ?: data["body"] as? String
                    ?: "",
                date = date,
                imageUrl = data["imageUrl"] as? String ?: data["image"] as? String,
                publishedAt = publishedAt
            )
        }.sortedByDescending { it.publishedAt?.toDate()?.time ?: 0L }

        MainUiState(
            data = newsItems,
            isLoading = false,
            error = null,
            isFallback = false
        )
    } catch (error: Exception) {
        MainUiState(
            data = emptyList(),
            isLoading = false,
            error = error.localizedMessage ?: "Unable to load news articles.",
            isFallback = false
        )
    }
}
