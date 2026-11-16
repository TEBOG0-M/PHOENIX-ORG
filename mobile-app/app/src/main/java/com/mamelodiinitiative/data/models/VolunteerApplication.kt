package com.mamelodiinitiative.data.models

/**
 * Android presentation model for the shared website Firestore application schema.
 *
 * Firestore fields remain: uid, name, email, phone, skills (array), missionId,
 * missionTitle, date, note, status, createdAt and decidedAt.
 * The repository maps those fields explicitly; this model is not serialized directly.
 */
data class VolunteerApplication(
    val id: String = "",
    val uid: String = "",
    val fullName: String = "",
    val email: String = "",
    val phone: String = "",
    val skills: String = "",
    val programmePreference: String = "",
    val availability: String = "",
    val missionId: String = "",
    val missionTitle: String = "",
    val date: String = "",
    val note: String = "",
    val status: String = "pending",
    val createdAt: String = "",
    val decidedAt: String? = null
)
