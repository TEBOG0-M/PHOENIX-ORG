package com.mamelodiinitiative.auth

import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.firestore.FirebaseFirestore
import com.mamelodiinitiative.data.models.UserProfile
import kotlinx.coroutines.tasks.await

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
            val profile = doc.toObject(UserProfile::class.java)
            if (profile != null && profile.uid.isNotBlank()) {
                return profile
            }
        }
        // Recover missing or incomplete profile
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

    fun signOut() = auth.signOut()
}
