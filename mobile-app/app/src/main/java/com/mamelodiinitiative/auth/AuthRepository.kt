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

    suspend fun register(email: String, password: String): Result<FirebaseUser> = runCatching {
        val result = auth.createUserWithEmailAndPassword(email.trim(), password).await()
        val user = requireNotNull(result.user) { "No user returned after registration." }

        val profile = UserProfile(
            uid = user.uid,
            fullName = "",
            email = user.email.orEmpty().ifBlank { email.trim() },
            role = "volunteer",
            createdAt = Timestamp.now()
        )
        firestore.collection("users").document(user.uid).set(profile).await()
        user
    }

    suspend fun signIn(email: String, password: String): Result<FirebaseUser> = runCatching {
        val result = auth.signInWithEmailAndPassword(email.trim(), password).await()
        requireNotNull(result.user) { "No user returned after sign-in." }
    }

    suspend fun getUserProfile(uid: String): Result<UserProfile?> = runCatching {
        val doc = firestore.collection("users").document(uid).get().await()
        if (doc.exists()) {
            doc.toObject(UserProfile::class.java)
        } else {
            null
        }
    }

    fun signOut() = auth.signOut()
}
