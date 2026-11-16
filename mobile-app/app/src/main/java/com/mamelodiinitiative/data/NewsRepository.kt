package com.mamelodiinitiative.data

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.mamelodiinitiative.data.models.NewsItem
import com.mamelodiinitiative.data.sampledata.sampleNews
import com.mamelodiinitiative.viewmodel.MainUiState
import kotlinx.coroutines.tasks.await

class NewsRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {
    suspend fun getNews(): MainUiState<NewsItem> {
        return try {
            val snapshot = firestore.collection("news_articles")
                .orderBy("publishedAt", Query.Direction.DESCENDING)
                .get()
                .await()
            if (!snapshot.isEmpty) {
                val newsItems = snapshot.documents.mapIndexed { index, doc ->
                    val item = doc.toObject(NewsItem::class.java) ?: NewsItem()
                    item.copy(
                        docId = doc.id,
                        id = if (item.id != 0) item.id else (index + 1)
                    )
                }
                MainUiState(data = newsItems, isLoading = false, error = null, isFallback = false)
            } else {
                MainUiState(data = sampleNews, isLoading = false, error = null, isFallback = true)
            }
        } catch (e: Exception) {
            try {
                val snapshot = firestore.collection("news_articles").get().await()
                if (!snapshot.isEmpty) {
                    val newsItems = snapshot.documents.mapIndexed { index, doc ->
                        val item = doc.toObject(NewsItem::class.java) ?: NewsItem()
                        item.copy(
                            docId = doc.id,
                            id = if (item.id != 0) item.id else (index + 1)
                        )
                    }
                    return MainUiState(data = newsItems, isLoading = false, error = null, isFallback = false)
                }
            } catch (_: Exception) {}

            MainUiState(data = sampleNews, isLoading = false, error = e.localizedMessage, isFallback = true)
        }
    }
}
