package com.mamelodiinitiative.data

import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.mamelodiinitiative.data.models.ContactMessage
import kotlinx.coroutines.tasks.await

class ContactRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
) {
    suspend fun submitMessage(message: ContactMessage): Result<Unit> = runCatching {
        val docRef = firestore.collection("mail").document()
        val finalMsg = message.copy(
            id = docRef.id,
            uid = auth.currentUser?.uid,
            createdAt = Timestamp.now()
        )
        docRef.set(finalMsg).await()
    }
}
