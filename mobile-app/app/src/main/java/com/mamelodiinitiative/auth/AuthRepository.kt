package com.mamelodiinitiative.auth

import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.firestore.FirebaseFirestore
import com.mamelodiinitiative.data.models.UserProfile
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class AuthRepository(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance(),
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {
    val currentUser: FirebaseUser? get() = auth.currentUser

    suspend fun register(email: String, password: String, fullName: String): Result<FirebaseUser> = runCatching {
        val result = auth.createUserWithEmailAndPassword(email.trim(), password).await()
        val user = requireNotNull(result.user) { "No user returned after registration." }

        val cleanName = fullName.trim().ifBlank { email.substringBefore("@") }
        val profile = UserProfile(
            uid = user.uid,
            fullName = cleanName,
            email = user.email.orEmpty().ifBlank { email.trim() },
            role = "volunteer",
            createdAt = Timestamp.now()
        )

        runCatching {
            firestore.collection("users").document(user.uid).set(profile).await()
        }.onFailure {
            // Retry profile creation once
            firestore.collection("users").document(user.uid).set(profile).await()
        }
        user
    }

    suspend fun signIn(email: String, password: String): Result<FirebaseUser> = runCatching {
        val result = auth.signInWithEmailAndPassword(email.trim(), password).await()
        requireNotNull(result.user) { "No user returned after sign-in." }
    }

    suspend fun ensureUserProfile(user: FirebaseUser): UserProfile {
        val docRef = firestore.collection("users").document(user.uid)
        val doc = docRef.get().await()
        if (doc.exists()) {
            val uid = doc.getString("uid").orEmpty().ifBlank { user.uid }
            val fullName = doc.getString("fullName").orEmpty().ifBlank {
                user.displayName.orEmpty().ifBlank { user.email?.substringBefore("@").orEmpty() }
            }
            val email = doc.getString("email").orEmpty().ifBlank { user.email.orEmpty() }
            val role = doc.getString("role").orEmpty().ifBlank { "volunteer" }
            val createdAt = parseTimestamp(doc.get("createdAt"))

            return UserProfile(
                uid = uid,
                fullName = fullName,
                email = email,
                role = role,
                createdAt = createdAt
            )
        }
        // Recover missing or incomplete profile only when document does not exist
        val fallbackProfile = UserProfile(
            uid = user.uid,
            fullName = user.displayName.orEmpty().ifBlank { user.email?.substringBefore("@").orEmpty() },
            email = user.email.orEmpty(),
            role = "volunteer",
            createdAt = Timestamp.now()
        )
        docRef.set(fallbackProfile).await()
        return fallbackProfile
    }

    private fun parseTimestamp(value: Any?): Timestamp? {
        return when (value) {
            is Timestamp -> value
            is Date -> Timestamp(value)
            is Number -> Timestamp(Date(value.toLong()))
            is String -> {
                val formats = listOf(
                    SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") },
                    SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") },
                    SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS", Locale.getDefault()),
                    SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()),
                    SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                )
                for (fmt in formats) {
                    try {
                        val parsed = fmt.parse(value)
                        if (parsed != null) return Timestamp(parsed)
                    } catch (_: Exception) {}
                }
                null
            }
            else -> null
        }
    }

    fun signOut() = auth.signOut()
}
