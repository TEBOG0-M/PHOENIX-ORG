package com.mamelodiinitiative.data

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.mamelodiinitiative.data.models.VolunteerApplication
import com.mamelodiinitiative.data.models.VolunteerProfile
import kotlinx.coroutines.tasks.await

class VolunteerRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
) {
    private fun mapApplication(document: com.google.firebase.firestore.DocumentSnapshot): VolunteerApplication {
        val data = document.data.orEmpty()
        val skills = when (val value = data["skills"]) {
            is List<*> -> value.filterIsInstance<String>().joinToString(", ")
            is String -> value
            else -> ""
        }
        val status = when ((data["status"] as? String)?.lowercase()) {
            "accepted" -> "approved"
            "declined" -> "rejected"
            else -> (data["status"] as? String) ?: "pending"
        }

        return VolunteerApplication(
            id = document.id,
            uid = data["uid"] as? String ?: "",
            fullName = data["name"] as? String ?: data["fullName"] as? String ?: "",
            email = data["email"] as? String ?: "",
            phone = data["phone"] as? String ?: "",
            skills = skills,
            missionId = data["missionId"] as? String ?: "",
            missionTitle = data["missionTitle"] as? String ?: "",
            date = data["date"] as? String ?: "",
            note = data["note"] as? String ?: "",
            status = status,
            createdAt = data["createdAt"] as? String
                ?: (data["createdAt"] as? com.google.firebase.Timestamp)?.toDate()?.toInstant()?.toString().orEmpty(),
            decidedAt = data["decidedAt"] as? String
        )
    }

    suspend fun submitApplication(application: VolunteerApplication): Result<Unit> = runCatching {
        val user = auth.currentUser ?: throw IllegalStateException("User must be authenticated to submit")
        val docRef = firestore.collection("applications").document()
        val profile = firestore.collection("users").document(user.uid).get().await().data.orEmpty()
        val skills = when (val value = profile["skills"]) {
            is List<*> -> value.filterIsInstance<String>()
            is String -> value.split(",").map(String::trim).filter(String::isNotEmpty)
            else -> emptyList()
        }
        val name = (profile["name"] as? String)
            ?: (profile["fullName"] as? String)
            ?: user.displayName.orEmpty()

        val record = mapOf(
            "uid" to user.uid,
            "name" to name,
            "email" to (profile["email"] as? String ?: user.email.orEmpty()),
            "phone" to (profile["phone"] as? String ?: ""),
            "skills" to skills,
            "missionId" to application.missionId,
            "missionTitle" to application.missionTitle,
            "date" to application.date,
            "note" to application.note,
            "status" to "pending",
            "createdAt" to java.time.Instant.now().toString(),
            "decidedAt" to null
        )
        docRef.set(record).await()
    }

    suspend fun getUserApplications(uid: String): Result<List<VolunteerApplication>> = runCatching {
        firestore.collection("applications")
            .whereEqualTo("uid", uid)
            .get().await().documents
            .map(::mapApplication)
            .sortedByDescending { it.createdAt }
    }

    suspend fun getLatestUserApplication(uid: String): Result<VolunteerApplication?> = runCatching {
        firestore.collection("applications")
            .whereEqualTo("uid", uid)
            .get().await().documents
            .map(::mapApplication)
            .maxByOrNull { it.createdAt }
    }

    suspend fun getAllApplications(): Result<List<VolunteerApplication>> = runCatching {
        firestore.collection("applications").get().await().documents
            .map(::mapApplication)
            .sortedByDescending { it.createdAt }
    }

    suspend fun getAllVolunteers(): Result<List<VolunteerProfile>> = runCatching {
        firestore.collection("users")
            .whereEqualTo("role", "volunteer")
            .get().await().documents
            .map { document ->
                val data = document.data.orEmpty()
                val skills = when (val value = data["skills"]) {
                    is List<*> -> value.filterIsInstance<String>()
                    is String -> value.split(",").map(String::trim).filter(String::isNotEmpty)
                    else -> emptyList()
                }
                val availability = when (val value = data["availability"]) {
                    is List<*> -> value.filterIsInstance<String>()
                    is String -> value.split(",").map(String::trim).filter(String::isNotEmpty)
                    else -> emptyList()
                }
                VolunteerProfile(
                    uid = document.getString("uid")?.ifBlank { document.id } ?: document.id,
                    name = document.getString("name") ?: document.getString("fullName").orEmpty(),
                    email = document.getString("email").orEmpty(),
                    phone = document.getString("phone").orEmpty(),
                    address = document.getString("address").orEmpty(),
                    bio = document.getString("bio").orEmpty(),
                    callSign = document.getString("callSign").orEmpty(),
                    skills = skills,
                    availability = availability,
                    createdAt = document.getString("createdAt")
                        ?: (data["createdAt"] as? com.google.firebase.Timestamp)?.toDate()?.toInstant()?.toString().orEmpty()
                )
            }
            .sortedBy { it.name.lowercase() }
    }

    suspend fun updateApplicationStatus(applicationId: String, status: String): Result<Unit> = runCatching {
        val websiteStatus = when (status.lowercase()) {
            "approved", "accepted" -> "accepted"
            "rejected", "declined" -> "declined"
            else -> throw IllegalArgumentException("Unsupported application status: $status")
        }
        firestore.collection("applications").document(applicationId)
            .update(mapOf("status" to websiteStatus, "decidedAt" to java.time.Instant.now().toString()))
            .await()
    }
}
