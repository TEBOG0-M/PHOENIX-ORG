package com.mamelodiinitiative.data

import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.mamelodiinitiative.data.models.Programme
import com.mamelodiinitiative.viewmodel.MainUiState
import kotlinx.coroutines.tasks.await

class ProgrammeRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {
    private fun mapMission(document: com.google.firebase.firestore.DocumentSnapshot, fallbackId: Int): Programme {
        val data = document.data.orEmpty()
        return Programme(
            docId = document.id,
            id = (data["id"] as? Number)?.toInt() ?: fallbackId,
            title = data["title"] as? String ?: "",
            description = data["summary"] as? String ?: data["description"] as? String ?: "",
            imageUrl = data["image"] as? String ?: data["imageUrl"] as? String,
            startDate = data["startDate"] as? String ?: "",
            endDate = data["endDate"] as? String ?: "",
            sector = data["sector"] as? String ?: "",
            cadence = data["cadence"] as? String ?: "",
            location = data["location"] as? String ?: "",
            volunteersNeeded = (data["volunteersNeeded"] as? Number)?.toInt() ?: 0,
            enrolled = (data["enrolled"] as? Number)?.toInt() ?: 0,
            fundingTarget = (data["fundingTarget"] as? Number)?.toDouble() ?: 0.0,
            raised = (data["raised"] as? Number)?.toDouble() ?: 0.0,
            status = data["status"] as? String ?: "ongoing",
            featured = data["featured"] as? Boolean ?: false,
            createdAt = data["createdAt"] as? String ?: "",
            updatedAt = data["updatedAt"] as? String ?: ""
        )
    }

    suspend fun getProgrammes(): MainUiState<Programme> = try {
        val snapshot = firestore.collection("missions").get().await()
        val programmes = snapshot.documents.mapIndexed { index, document ->
            mapMission(document, index + 1)
        }
        MainUiState(data = programmes, isLoading = false, error = null, isFallback = false)
    } catch (e: Exception) {
        MainUiState(data = emptyList(), isLoading = false, error = e.localizedMessage ?: "Unable to load missions.", isFallback = false)
    }

    suspend fun saveProgramme(programme: Programme): Result<Unit> = runCatching {
        val missions = firestore.collection("missions")
        val now = java.time.Instant.now().toString()
        if (programme.docId.isNotBlank()) {
            // Update only fields edited by this Android screen. Preserve all website-owned fields.
            missions.document(programme.docId).update(
                mapOf(
                    "title" to programme.title,
                    "summary" to programme.description,
                    "image" to programme.imageUrl,
                    "updatedAt" to now
                )
            ).await()
        } else {
            val doc = missions.document()
            doc.set(
                mapOf(
                    "title" to programme.title,
                    "summary" to programme.description,
                    "image" to programme.imageUrl,
                    "startDate" to programme.startDate,
                    "endDate" to programme.endDate,
                    "sector" to programme.sector,
                    "cadence" to programme.cadence,
                    "location" to programme.location,
                    "volunteersNeeded" to programme.volunteersNeeded,
                    "enrolled" to 0,
                    "fundingTarget" to programme.fundingTarget,
                    "raised" to 0,
                    "status" to "started",
                    "featured" to false,
                    "createdAt" to now,
                    "updatedAt" to now
                )
            ).await()
        }
    }

    suspend fun deleteProgramme(docId: String): Result<Unit> = runCatching {
        require(docId.isNotBlank()) { "Mission document ID is required." }
        firestore.collection("missions").document(docId).delete().await()
    }
}
