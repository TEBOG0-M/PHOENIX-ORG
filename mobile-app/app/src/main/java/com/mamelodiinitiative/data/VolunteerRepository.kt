package com.mamelodiinitiative.data

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.mamelodiinitiative.data.models.VolunteerApplication
import com.mamelodiinitiative.data.models.VolunteerProfile
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class VolunteerRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
) {
    private fun Any?.toStoredDateString(): String = when (this) {
        is String -> this
        is com.google.firebase.Timestamp -> toDate().toInstant().toString()
        is java.util.Date -> toInstant().toString()
        is Number -> java.time.Instant.ofEpochMilli(toLong()).toString()
        else -> ""
    }

    private fun mapApplication(document: com.google.firebase.firestore.DocumentSnapshot): VolunteerApplication {
        val data = document.data.orEmpty()
        val skills = when (val value = data["skills"]) {
            is List<*> -> value.filterIsInstance<String>().joinToString(", ")
            is String -> value
            else -> ""
        }
        val note = data["note"] as? String ?: ""
        val availability = Regex("(?m)^Availability: (.*)$")
            .find(note)?.groupValues?.getOrNull(1).orEmpty()
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
            note = note,
            availability = availability,
            status = status,
            createdAt = data["createdAt"].toStoredDateString(),
            decidedAt = data["decidedAt"] as? String
        )
    }

    suspend fun submitApplication(application: VolunteerApplication): Result<String> = runCatching {
        val user = auth.currentUser ?: throw IllegalStateException("User must be authenticated to submit")
        val profile = firestore.collection("users").document(user.uid).get().await().data.orEmpty()

        val name = application.fullName.trim().ifBlank {
            (profile["name"] as? String)
                ?: (profile["fullName"] as? String)
                ?: user.displayName.orEmpty()
        }
        val email = application.email.trim().ifBlank {
            (profile["email"] as? String) ?: user.email.orEmpty()
        }
        val phone = application.phone.trim().ifBlank {
            profile["phone"] as? String ?: ""
        }
        require(name.isNotBlank()) { "Please provide your full name." }
        require(email.isNotBlank()) { "Please provide your email address." }
        require(phone.isNotBlank()) { "Please provide your phone number." }
        require(application.availability.isNotBlank()) { "Please provide your availability." }

        val existingApplications = firestore.collection("applications")
            .whereEqualTo("uid", user.uid)
            .get().await().documents
        val hasActiveApplication = existingApplications.any { document ->
            val data = document.data.orEmpty()
            val sameMission = (data["missionId"] as? String).orEmpty() == application.missionId
            val status = (data["status"] as? String)?.lowercase()
            sameMission && status in listOf("pending", "accepted")
        }
        require(!hasActiveApplication) {
            "You already have an active application for this programme."
        }

        val skills = application.skills
            .split(",", ";", "\n")
            .map(String::trim)
            .filter(String::isNotEmpty)
            .distinct()
        val note = buildString {
            append("Availability: ")
            append(application.availability.trim())
            if (application.note.isNotBlank()) {
                append("\n\n")
                append(application.note.trim())
            }
        }
        val now = java.time.Instant.now().toString()
        val date = application.date.ifBlank {
            SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        }
        val docRef = firestore.collection("applications").document()
        val record = mapOf(
            "uid" to user.uid,
            "name" to name,
            "email" to email,
            "phone" to phone,
            "skills" to skills,
            "missionId" to application.missionId,
            "missionTitle" to application.missionTitle,
            "date" to date,
            "note" to note,
            "status" to "pending",
            "createdAt" to now,
            "decidedAt" to null
        )
        docRef.set(record).await()
        docRef.id
    }

    fun listenToAllApplications(
        onResult: (Result<List<VolunteerApplication>>) -> Unit
    ): ListenerRegistration = firestore.collection("applications")
        .addSnapshotListener { snapshot, error ->
            if (error != null) {
                onResult(Result.failure(error))
            } else {
                onResult(runCatching {
                    snapshot?.documents.orEmpty()
                        .map(::mapApplication)
                        .sortedByDescending { it.createdAt }
                })
            }
        }

    fun listenToLatestUserApplication(
        uid: String,
        onResult: (Result<VolunteerApplication?>) -> Unit
    ): ListenerRegistration = firestore.collection("applications")
        .whereEqualTo("uid", uid)
        .addSnapshotListener { snapshot, error ->
            if (error != null) {
                onResult(Result.failure(error))
            } else {
                onResult(runCatching {
                    snapshot?.documents.orEmpty()
                        .map(::mapApplication)
                        .maxByOrNull { it.createdAt }
                })
            }
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
                    uid = data["uid"] as? String ?: document.id,
                    name = data["name"] as? String ?: data["fullName"] as? String ?: "",
                    email = data["email"] as? String ?: "",
                    phone = data["phone"] as? String ?: "",
                    address = data["address"] as? String ?: "",
                    bio = data["bio"] as? String ?: "",
                    callSign = data["callSign"] as? String ?: "",
                    skills = skills,
                    availability = availability,
                    createdAt = data["createdAt"].toStoredDateString()
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
