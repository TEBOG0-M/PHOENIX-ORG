package com.mamelodiinitiative.data.models

import com.google.firebase.Timestamp

data class UserProfile(
    val uid: String = "",
    val fullName: String = "",
    val email: String = "",
    val role: String = "volunteer",
    val createdAt: Timestamp? = null
)
