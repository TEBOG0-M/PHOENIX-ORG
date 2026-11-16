package com.mamelodiinitiative.data

import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.mamelodiinitiative.data.models.VolunteerApplication
import kotlinx.coroutines.tasks.await

class VolunteerRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
) {
    suspend fun submitApplication(application: VolunteerApplication): Result<Unit> = runCatching {
        val user = auth.currentUser ?: throw IllegalStateException("User must be authenticated to submit")

        val docRef = firestore.collection("volunteer_applications").document()
        val finalApp = application.copy(
            id = docRef.id,
            userId = user.uid,
            status = "pending",
            submittedAt = Timestamp.now()
        )

        docRef.set(finalApp).await()
    }

    suspend fun getUserApplications(userId: String): Result<List<VolunteerApplication>> = runCatching {
        val snapshot = firestore.collection("volunteer_applications")
            .whereEqualTo("userId", userId)
            .get()
            .await()
        snapshot.toObjects(VolunteerApplication::class.java)
    }

    suspend fun getLatestUserApplication(userId: String): Result<VolunteerApplication?> = runCatching {
        val snapshot = firestore.collection("volunteer_applications")
            .whereEqualTo("userId", userId)
            .get()
            .await()
        val apps = snapshot.toObjects(VolunteerApplication::class.java)
        apps.maxByOrNull { it.submittedAt?.seconds ?: 0 }
    }

    suspend fun getAllApplications(): Result<List<VolunteerApplication>> = runCatching {
        val snapshot = firestore.collection("volunteer_applications")
            .get()
            .await()
        snapshot.toObjects(VolunteerApplication::class.java).sortedByDescending { it.submittedAt?.seconds ?: 0 }
    }

    suspend fun updateApplicationStatus(applicationId: String, status: String): Result<Unit> = runCatching {
        firestore.collection("volunteer_applications")
            .document(applicationId)
            .update("status", status)
            .await()
    }
}
