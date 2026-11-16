package com.mamelodiinitiative.data.models

import com.google.firebase.Timestamp

data class NewsItem(
    val id: Int = 0,
    val docId: String = "",
    val title: String = "",
    val description: String = "",
    val date: String = "",
    val imageUrl: String? = null,
    val publishedAt: Timestamp? = null
)
