package com.mamelodiinitiative.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ListAlt
import androidx.compose.material.icons.filled.Pending
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.mamelodiinitiative.data.models.Programme
import com.mamelodiinitiative.data.models.VolunteerApplication
import com.mamelodiinitiative.navigation.Routes
import com.mamelodiinitiative.ui.components.MamelodiBackButton
import com.mamelodiinitiative.ui.theme.GreenLight
import com.mamelodiinitiative.ui.theme.GreenPrimary
import com.mamelodiinitiative.ui.theme.TextSecondary
import com.mamelodiinitiative.ui.utils.bounceClick
import com.mamelodiinitiative.viewmodel.ManagerViewModel

@Composable
fun ManagerDashboardScreen(
    onNavigate: (String) -> Unit,
    managerViewModel: ManagerViewModel = viewModel()
) {
    val appsState by managerViewModel.applicationsState.collectAsState()
    val programmesState by managerViewModel.programmesState.collectAsState()
    val actionStatus by managerViewModel.actionStatus.collectAsState()
    val haptic = LocalHapticFeedback.current

    val pendingCount = appsState.data.count { it.status == "pending" }
    val approvedCount = appsState.data.count { it.status == "approved" }
    val programmesCount = programmesState.data.size

    LaunchedEffect(Unit) {
        managerViewModel.loadManagerData()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = "MANAGER PORTAL",
                    color = GreenPrimary,
                    style = MaterialTheme.typography.labelLarge.copy(letterSpacing = 1.sp),
                    fontWeight = FontWeight.Black
                )
                Text(
                    text = "Organisational Overview",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.ExtraBold
                )
            }
            IconButton(onClick = { managerViewModel.loadManagerData() }) {
                Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = GreenPrimary)
            }
        }

        if (actionStatus != null) {
            Card(
                colors = CardDefaults.cardColors(containerColor = GreenLight),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        actionStatus!!,
                        style = MaterialTheme.typography.bodyMedium,
                        color = GreenPrimary,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.weight(1f)
                    )
                    IconButton(onClick = { managerViewModel.clearActionStatus() }) {
                        Icon(Icons.Default.CheckCircle, null, tint = GreenPrimary)
                    }
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            MetricCard(
                title = "Pending Review",
                count = pendingCount.toString(),
                icon = Icons.Default.Pending,
                color = Color(0xFFE65100),
                modifier = Modifier.weight(1f),
                onClick = { onNavigate(Routes.MANAGER_APPLICATIONS) }
            )
            MetricCard(
                title = "Approved Volunteers",
                count = approvedCount.toString(),
                icon = Icons.Default.CheckCircle,
                color = GreenPrimary,
                modifier = Modifier.weight(1f),
                onClick = { onNavigate(Routes.MANAGER_APPLICATIONS) }
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            MetricCard(
                title = "Programmes",
                count = programmesCount.toString(),
                icon = Icons.Default.School,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.weight(1f),
                onClick = { onNavigate(Routes.PROGRAMMES) }
            )
            MetricCard(
                title = "Total Applications",
                count = appsState.data.size.toString(),
                icon = Icons.Default.ListAlt,
                color = MaterialTheme.colorScheme.secondary,
                modifier = Modifier.weight(1f),
                onClick = { onNavigate(Routes.MANAGER_APPLICATIONS) }
            )
        }

        Text(
            text = "Management Actions",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.ExtraBold
        )

        Button(
            onClick = {
                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                onNavigate(Routes.MANAGER_APPLICATIONS)
            },
            modifier = Modifier.fillMaxWidth().height(56.dp).bounceClick(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Icon(Icons.Default.ListAlt, null)
            Spacer(Modifier.width(10.dp))
            Text("Review Applications ($pendingCount pending)", fontWeight = FontWeight.Bold)
        }

        OutlinedButton(
            onClick = {
                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                onNavigate(Routes.managerProgrammeEdit("new"))
            },
            modifier = Modifier.fillMaxWidth().height(56.dp).bounceClick(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Icon(Icons.Default.Add, null)
            Spacer(Modifier.width(10.dp))
            Text("Create New Programme", fontWeight = FontWeight.Bold)
        }

        if (appsState.data.isNotEmpty()) {
            Text(
                text = "Recent Applications",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.ExtraBold
            )

            appsState.data.take(3).forEach { app ->
                ApplicationSummaryCard(
                    application = app,
                    onApprove = { managerViewModel.updateApplicationStatus(app.id, "approved") },
                    onReject = { managerViewModel.updateApplicationStatus(app.id, "rejected") }
                )
            }
        }
    }
}

@Composable
fun ManagerApplicationsScreen(
    onBack: () -> Unit,
    managerViewModel: ManagerViewModel = viewModel()
) {
    val appsState by managerViewModel.applicationsState.collectAsState()
    var selectedFilter by remember { mutableStateOf("all") }
    val haptic = LocalHapticFeedback.current

    val filteredApps = when (selectedFilter) {
        "pending" -> appsState.data.filter { it.status == "pending" }
        "approved" -> appsState.data.filter { it.status == "approved" }
        "rejected" -> appsState.data.filter { it.status == "rejected" }
        else -> appsState.data
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        MamelodiBackButton(onClick = onBack)

        Text(
            text = "VOLUNTEER APPLICATIONS",
            color = GreenPrimary,
            style = MaterialTheme.typography.labelLarge.copy(letterSpacing = 1.sp),
            fontWeight = FontWeight.Black
        )

        Text(
            text = "Review & Manage Submissions",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.ExtraBold
        )

        SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
            SegmentedButton(
                shape = SegmentedButtonDefaults.itemShape(index = 0, count = 4),
                onClick = { selectedFilter = "all" },
                selected = selectedFilter == "all",
                label = { Text("All (${appsState.data.size})", fontSize = 12.sp) }
            )
            SegmentedButton(
                shape = SegmentedButtonDefaults.itemShape(index = 1, count = 4),
                onClick = { selectedFilter = "pending" },
                selected = selectedFilter == "pending",
                label = { Text("Pending", fontSize = 12.sp) }
            )
            SegmentedButton(
                shape = SegmentedButtonDefaults.itemShape(index = 2, count = 4),
                onClick = { selectedFilter = "approved" },
                selected = selectedFilter == "approved",
                label = { Text("Approved", fontSize = 12.sp) }
            )
            SegmentedButton(
                shape = SegmentedButtonDefaults.itemShape(index = 3, count = 4),
                onClick = { selectedFilter = "rejected" },
                selected = selectedFilter == "rejected",
                label = { Text("Rejected", fontSize = 12.sp) }
            )
        }

        if (filteredApps.isEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth().padding(vertical = 20.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Text(
                    text = "No $selectedFilter volunteer applications found.",
                    modifier = Modifier.padding(24.dp),
                    style = MaterialTheme.typography.bodyLarge,
                    color = TextSecondary
                )
            }
        } else {
            filteredApps.forEach { app ->
                ApplicationSummaryCard(
                    application = app,
                    onApprove = {
                        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                        managerViewModel.updateApplicationStatus(app.id, "approved")
                    },
                    onReject = {
                        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                        managerViewModel.updateApplicationStatus(app.id, "rejected")
                    }
                )
            }
        }
    }
}

@Composable
fun ManagerProgrammeEditScreen(
    docId: String,
    onBack: () -> Unit,
    managerViewModel: ManagerViewModel = viewModel()
) {
    val programmesState by managerViewModel.programmesState.collectAsState()
    val isNew = docId == "new" || docId.isBlank()
    val existingProgramme = if (!isNew) programmesState.data.firstOrNull { it.docId == docId || it.id.toString() == docId } else null

    var title by remember { mutableStateOf(existingProgramme?.title.orEmpty()) }
    var description by remember { mutableStateOf(existingProgramme?.description.orEmpty()) }
    var imageUrl by remember { mutableStateOf(existingProgramme?.imageUrl.orEmpty()) }
    var isSaving by remember { mutableStateOf(false) }
    val haptic = LocalHapticFeedback.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        MamelodiBackButton(onClick = onBack)

        Text(
            text = if (isNew) "NEW PROGRAMME" else "EDIT PROGRAMME",
            color = GreenPrimary,
            style = MaterialTheme.typography.labelLarge.copy(letterSpacing = 1.sp),
            fontWeight = FontWeight.Black
        )

        Text(
            text = if (isNew) "Publish New Programme" else "Update Programme Details",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.ExtraBold
        )

        OutlinedTextField(
            value = title,
            onValueChange = { title = it },
            label = { Text("Programme Title *") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp)
        )

        OutlinedTextField(
            value = description,
            onValueChange = { description = it },
            label = { Text("Description *") },
            minLines = 4,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp)
        )

        OutlinedTextField(
            value = imageUrl,
            onValueChange = { imageUrl = it },
            label = { Text("Image URL (optional)") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp)
        )

        Button(
            onClick = {
                if (title.isNotBlank() && description.isNotBlank()) {
                    isSaving = true
                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                    val pToSave = Programme(
                        docId = if (isNew) "" else docId,
                        title = title,
                        description = description,
                        imageUrl = imageUrl.ifBlank { null }
                    )
                    managerViewModel.saveProgramme(pToSave) { success ->
                        isSaving = false
                        if (success) onBack()
                    }
                }
            },
            enabled = !isSaving && title.isNotBlank() && description.isNotBlank(),
            modifier = Modifier.fillMaxWidth().height(56.dp).bounceClick(),
            shape = RoundedCornerShape(16.dp)
        ) {
            if (isSaving) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
            } else {
                Text(if (isNew) "Publish Programme" else "Save Changes", fontWeight = FontWeight.Bold)
            }
        }

        if (!isNew) {
            OutlinedButton(
                onClick = {
                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                    managerViewModel.deleteProgramme(docId)
                    onBack()
                },
                modifier = Modifier.fillMaxWidth().height(56.dp).bounceClick(),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error),
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.Delete, null)
                Spacer(Modifier.width(8.dp))
                Text("Delete Programme", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun MetricCard(
    title: String,
    count: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = modifier.height(110.dp).bounceClick(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(count, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black, color = color)
                Icon(icon, null, tint = color, modifier = Modifier.size(24.dp))
            }
            Text(title, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = TextSecondary)
        }
    }
}

@Composable
private fun ApplicationSummaryCard(
    application: VolunteerApplication,
    onApprove: () -> Unit,
    onReject: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth().bounceClick(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(application.fullName.ifBlank { "Applicant" }, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                StatusBadge(status = application.status)
            }

            Text("Email: ${application.email}", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
            Text("Phone: ${application.phone}", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
            if (application.skills.isNotBlank()) {
                Text("Skills: ${application.skills}", style = MaterialTheme.typography.bodyMedium)
            }
            if (application.availability.isNotBlank()) {
                Text("Availability: ${application.availability}", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (application.status != "approved") {
                    Button(
                        onClick = onApprove,
                        colors = ButtonDefaults.buttonColors(containerColor = GreenPrimary),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Approve", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
                Spacer(Modifier.width(8.dp))
                if (application.status != "rejected") {
                    OutlinedButton(
                        onClick = onReject,
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Reject", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun StatusBadge(status: String) {
    val (bgColor, textColor, label) = when (status) {
        "approved" -> Triple(GreenLight, GreenPrimary, "APPROVED")
        "rejected" -> Triple(MaterialTheme.colorScheme.errorContainer, MaterialTheme.colorScheme.error, "REJECTED")
        else -> Triple(Color(0xFFFFF3E0), Color(0xFFE65100), "PENDING")
    }

    Surface(
        color = bgColor,
        shape = RoundedCornerShape(8.dp)
    ) {
        Text(
            text = label,
            color = textColor,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Black,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
        )
    }
}
