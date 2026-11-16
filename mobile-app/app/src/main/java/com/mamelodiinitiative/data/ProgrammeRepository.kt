package com.mamelodiinitiative.data

import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.mamelodiinitiative.data.models.Programme
import com.mamelodiinitiative.data.sampledata.sampleProgrammes
import com.mamelodiinitiative.viewmodel.MainUiState
import kotlinx.coroutines.tasks.await

class ProgrammeRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {
    suspend fun getProgrammes(): MainUiState<Programme> {
        return try {
            val snapshot = firestore.collection("programmes").get().await()
            if (!snapshot.isEmpty) {
                val programmes = snapshot.documents.mapIndexed { index, doc ->
                    val p = doc.toObject(Programme::class.java) ?: Programme()
                    p.copy(
                        docId = doc.id,
                        id = if (p.id != 0) p.id else (index + 1)
                    )
                }
                MainUiState(data = programmes, isLoading = false, error = null, isFallback = false)
            } else {
                MainUiState(data = sampleProgrammes, isLoading = false, error = null, isFallback = true)
            }
        } catch (e: Exception) {
            MainUiState(data = sampleProgrammes, isLoading = false, error = e.localizedMessage, isFallback = true)
        }
    }

    suspend fun saveProgramme(programme: Programme): Result<Unit> = runCatching {
        val docRef = if (programme.docId.isNotBlank()) {
            firestore.collection("programmes").document(programme.docId)
        } else {
            firestore.collection("programmes").document()
        }
        val pToSave = programme.copy(
            docId = docRef.id,
            createdAt = programme.createdAt ?: Timestamp.now()
        )
        docRef.set(pToSave).await()
    }

    suspend fun deleteProgramme(docId: String): Result<Unit> = runCatching {
        firestore.collection("programmes").document(docId).delete().await()
    }
}
