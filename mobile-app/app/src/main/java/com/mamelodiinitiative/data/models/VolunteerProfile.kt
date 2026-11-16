package com.mamelodiinitiative.data.models

data class VolunteerProfile(
    val uid: String = "",
    val name: String = "",
    val email: String = "",
    val phone: String = "",
    val address: String = "",
    val bio: String = "",
    val callSign: String = "",
    val skills: List<String> = emptyList(),
    val availability: List<String> = emptyList(),
    val createdAt: String = ""
)
