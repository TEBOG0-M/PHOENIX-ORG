package com.mamelodiinitiative.data.models

import com.google.firebase.Timestamp

data class Programme(
    val id: Int = 0,
    val docId: String = "",
    val title: String = "",
    val description: String = "",
    val imageUrl: String? = null,
    val createdAt: Timestamp? = null
)
