package com.mamelodiinitiative.data.models

import com.google.firebase.Timestamp

data class ContactMessage(
    val id: String = "",
    val uid: String? = null,
    val name: String = "",
    val email: String = "",
    val subject: String = "",
    val message: String = "",
    val createdAt: Timestamp? = null
)
