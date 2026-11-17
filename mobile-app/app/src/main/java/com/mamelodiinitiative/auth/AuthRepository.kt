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
        writeWebsiteProfile(user, cleanName, "volunteer")
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
            val fullName = (doc.getString("name") ?: doc.getString("fullName")).orEmpty().ifBlank {
                user.displayName.orEmpty().ifBlank { user.email?.substringBefore("@").orEmpty() }
            }
            return UserProfile(
                uid = doc.getString("uid").orEmpty().ifBlank { user.uid },
                fullName = fullName,
                email = doc.getString("email").orEmpty().ifBlank { user.email.orEmpty() },
                role = doc.getString("role").orEmpty().ifBlank { "volunteer" },
                createdAt = parseTimestamp(doc.get("createdAt"))
            )
        }

        val name = user.displayName.orEmpty().ifBlank { user.email?.substringBefore("@").orEmpty() }
        writeWebsiteProfile(user, name, "volunteer")
        return UserProfile(
            uid = user.uid,
            fullName = name,
            email = user.email.orEmpty(),
            role = "volunteer",
            createdAt = Timestamp.now()
        )
    }

    private suspend fun writeWebsiteProfile(user: FirebaseUser, name: String, role: String) {
        firestore.collection("users").document(user.uid).set(
            mapOf(
                "uid" to user.uid,
                "name" to name,
                "email" to user.email.orEmpty(),
                "role" to role,
                "phone" to "",
                "address" to "",
                "bio" to "",
                "callSign" to "",
                "skills" to emptyList<String>(),
                "availability" to emptyList<String>(),
                "createdAt" to java.time.Instant.now().toString()
            )
        ).await()
    }

    private fun parseTimestamp(value: Any?): Timestamp? = when (value) {
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
            formats.firstNotNullOfOrNull { format ->
                runCatching { format.parse(value)?.let(::Timestamp) }.getOrNull()
            }
        }
        else -> null
    }

    fun signOut() = auth.signOut()
}
