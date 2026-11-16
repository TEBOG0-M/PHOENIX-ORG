package com.mamelodiinitiative.data.models

/**
 * Android presentation model for the website's missions collection.
 * Website field names are mapped explicitly by ProgrammeRepository.
 */
data class Programme(
    val id: Int = 0,
    val docId: String = "",
    val title: String = "",
    val description: String = "",
    val imageUrl: String? = null,
    val startDate: String = "",
    val endDate: String = "",
    val sector: String = "",
    val cadence: String = "",
    val location: String = "",
    val volunteersNeeded: Int = 0,
    val enrolled: Int = 0,
    val fundingTarget: Double = 0.0,
    val raised: Double = 0.0,
    val status: String = "ongoing",
    val featured: Boolean = false,
    val createdAt: String = "",
    val updatedAt: String = ""
)
