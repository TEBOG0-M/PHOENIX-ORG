package com.mamelodiinitiative.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ListAlt
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Pending
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.mamelodiinitiative.data.models.Programme
import com.mamelodiinitiative.data.models.VolunteerApplication
import com.mamelodiinitiative.data.models.VolunteerProfile
import com.mamelodiinitiative.navigation.Routes
import com.mamelodiinitiative.ui.components.MamelodiBackButton
import com.mamelodiinitiative.ui.theme.GreenLight
import com.mamelodiinitiative.ui.theme.GreenPrimary
import com.mamelodiinitiative.ui.theme.TextSecondary
import com.mamelodiinitiative.ui.utils.bounceClick
import com.mamelodiinitiative.viewmodel.ManagerViewModel

@Composable
fun GuardedManagerScreen(
    userRole: String?,
    onNavigateHome: () -> Unit,
    content: @Composable () -> Unit
) {
    if (userRole in listOf("manager", "admin")) {
        content()
    } else {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.AdminPanelSettings,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(48.dp)
                    )
                    Text(
                        text = "Access Restricted",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "You do not have manager or administrator permissions to access this portal.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center
                    )
                    Spacer(Modifier.height(8.dp))
                    Button(
                        onClick = onNavigateHome,
                        modifier = Modifier.fillMaxWidth().height(50.dp),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("Return to Home", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun ManagerDashboardScreen(
    onNavigate: (String) -> Unit,
    managerViewModel: ManagerViewModel = viewModel()
) {
    val appsState by managerViewModel.applicationsState.collectAsState()
    val programmesState by managerViewModel.programmesState.collectAsState()
    val volunteersState by managerViewModel.volunteersState.collectAsState()
    val actionStatus by managerViewModel.actionStatus.collectAsState()
    val haptic = LocalHapticFeedback.current

    val pendingCount = appsState.data.count { it.status == "pending" }
    val registeredVolunteerCount = volunteersState.data.size
    val programmesCount = programmesState.data.size

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

        if (appsState.error != null) {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "Applications could not be loaded: \${appsState.error}",
                    modifier = Modifier.padding(16.dp),
                    color = MaterialTheme.colorScheme.onErrorContainer
                )
            }
        }

        if (programmesState.error != null) {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "Missions could not be loaded: \${programmesState.error}",
                    modifier = Modifier.padding(16.dp),
                    color = MaterialTheme.colorScheme.onErrorContainer
                )
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
                count = if (appsState.isLoading) "—" else pendingCount.toString(),
                icon = Icons.Default.Pending,
                color = Color(0xFFE65100),
                modifier = Modifier.weight(1f),
                onClick = { onNavigate(Routes.MANAGER_APPLICATIONS) }
            )
            MetricCard(
                title = "Registered Volunteers",
                count = if (volunteersState.isLoading) "—" else registeredVolunteerCount.toString(),
                icon = Icons.Default.CheckCircle,
                color = GreenPrimary,
                modifier = Modifier.weight(1f),
                onClick = { onNavigate(Routes.MANAGER_VOLUNTEERS) }
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            MetricCard(
                title = "Programmes",
                count = if (programmesState.isLoading) "—" else programmesCount.toString(),
                icon = Icons.Default.School,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.weight(1f),
                onClick = { onNavigate(Routes.PROGRAMMES) }
            )
            MetricCard(
                title = "Total Applications",
                count = if (appsState.isLoading) "—" else appsState.data.size.toString(),
                icon = Icons.AutoMirrored.Filled.ListAlt,
                color = MaterialTheme.colorScheme.secondary,
                modifier = Modifier.weight(1f),
                onClick = { onNavigate(Routes.MANAGER_APPLICATIONS) }
            )
        }

        Text(
            text = "Quick action",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.ExtraBold
        )

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

        // Programmes Management Section
        Text(
            text = "Manage Programmes",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.ExtraBold
        )

        if (programmesState.data.isEmpty()) {
            Text("No programmes found.", color = TextSecondary)
        } else {
            programmesState.data.forEach { prog ->
                Card(
                    onClick = {
                        val identifier = prog.docId.ifBlank { prog.id.toString() }
                        onNavigate(Routes.managerProgrammeEdit(identifier))
                    },
                    modifier = Modifier.fillMaxWidth().bounceClick(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(prog.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text(prog.description, style = MaterialTheme.typography.bodySmall, color = TextSecondary, maxLines = 2)
                        }
                        TextButton(onClick = {
                            val identifier = prog.docId.ifBlank { prog.id.toString() }
                            onNavigate(Routes.managerProgrammeEdit(identifier))
                        }) {
                            Text("Edit", fontWeight = FontWeight.Bold, color = GreenPrimary)
                        }
                    }
                }
            }
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
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            MamelodiBackButton(onClick = onBack)
            IconButton(onClick = { managerViewModel.loadManagerData() }) {
                Icon(Icons.Default.Refresh, contentDescription = "Refresh applications", tint = GreenPrimary)
            }
        }

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

        when {
            appsState.isLoading -> Box(
                modifier = Modifier.fillMaxWidth().padding(36.dp),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = GreenPrimary)
            }

            appsState.error != null -> Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
            ) {
                Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Applications could not be loaded.", fontWeight = FontWeight.Bold)
                    Text(appsState.error.orEmpty(), color = MaterialTheme.colorScheme.onErrorContainer)
                    TextButton(onClick = { managerViewModel.loadManagerData() }) {
                        Text("Try again")
                    }
                }
            }

            filteredApps.isEmpty() -> Card(
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

            else -> filteredApps.forEach { app ->
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

    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var imageUrl by remember { mutableStateOf("") }
    var isSaving by remember { mutableStateOf(false) }
    var isDeleting by remember { mutableStateOf(false) }
    var initialized by remember(docId) { mutableStateOf(false) }
    val haptic = LocalHapticFeedback.current

    LaunchedEffect(programmesState.data, docId) {
        if (!isNew && !initialized) {
            val existing = programmesState.data.firstOrNull { it.docId == docId || it.id.toString() == docId }
            if (existing != null) {
                title = existing.title
                description = existing.description
                imageUrl = existing.imageUrl.orEmpty()
                initialized = true
            }
        }
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
                    val existing = programmesState.data.firstOrNull { it.docId == docId || it.id.toString() == docId }
                    val pToSave = Programme(
                        docId = if (isNew) "" else (existing?.docId?.ifBlank { docId } ?: docId),
                        id = existing?.id ?: 0,
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
                    isDeleting = true
                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                    val existing = programmesState.data.firstOrNull { it.docId == docId || it.id.toString() == docId }
                    val targetDocId = existing?.docId?.ifBlank { docId } ?: docId
                    managerViewModel.deleteProgramme(targetDocId) { success ->
                        isDeleting = false
                        if (success) onBack()
                    }
                },
                enabled = !isDeleting,
                modifier = Modifier.fillMaxWidth().height(56.dp).bounceClick(),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error),
                shape = RoundedCornerShape(16.dp)
            ) {
                if (isDeleting) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.error)
                } else {
                    Icon(Icons.Default.Delete, null)
                    Spacer(Modifier.width(8.dp))
                    Text("Delete Programme", fontWeight = FontWeight.Bold)
                }
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
            if (application.missionTitle.isNotBlank()) {
                Text("Programme: ${application.missionTitle}", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
            }
            if (application.date.isNotBlank()) {
                Text("Submitted for: ${application.date}", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            }
            if (application.skills.isNotBlank()) {
                Text("Skills: ${application.skills}", style = MaterialTheme.typography.bodyMedium)
            }
            if (application.availability.isNotBlank()) {
                Text("Availability: ${application.availability}", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            }
            val additionalNote = application.note.substringAfter("\n\n", "").trim()
            if (additionalNote.isNotBlank()) {
                Text("Applicant note: $additionalNote", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
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


@Composable
fun ManagerVolunteersScreen(
    onBack: () -> Unit,
    managerViewModel: ManagerViewModel = viewModel()
) {
    val state by managerViewModel.volunteersState.collectAsState()
    val applicationsState by managerViewModel.applicationsState.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    val filtered = remember(state.data, searchQuery) {
        val query = searchQuery.trim().lowercase()
        if (query.isBlank()) state.data else state.data.filter { volunteer ->
            listOf(volunteer.name, volunteer.email, volunteer.phone, volunteer.callSign)
                .any { it.lowercase().contains(query) } ||
                volunteer.skills.any { it.lowercase().contains(query) }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            MamelodiBackButton(onClick = onBack)
            IconButton(onClick = { managerViewModel.loadVolunteers() }) {
                Icon(Icons.Default.Refresh, contentDescription = "Refresh volunteers", tint = GreenPrimary)
            }
        }

        Text(
            "VOLUNTEER DIRECTORY",
            color = GreenPrimary,
            style = MaterialTheme.typography.labelLarge.copy(letterSpacing = 1.sp),
            fontWeight = FontWeight.Black
        )
        Text(
            "Registered Volunteers",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.ExtraBold
        )
        Text(
            "${state.data.size} registered volunteer profiles",
            color = TextSecondary,
            style = MaterialTheme.typography.bodyMedium
        )

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Search volunteers") },
            placeholder = { Text("Name, email, phone, call sign or skill") },
            singleLine = true,
            shape = RoundedCornerShape(14.dp)
        )

        when {
            state.isLoading -> Box(
                modifier = Modifier.fillMaxWidth().padding(36.dp),
                contentAlignment = Alignment.Center
            ) { CircularProgressIndicator() }

            state.error != null -> Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Volunteer profiles could not be loaded.", fontWeight = FontWeight.Bold)
                    Text(state.error.orEmpty(), color = MaterialTheme.colorScheme.onErrorContainer)
                    TextButton(onClick = { managerViewModel.loadVolunteers() }) { Text("Try again") }
                }
            }

            filtered.isEmpty() -> Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text(
                    if (state.data.isEmpty()) "No registered volunteer profiles were found." else "No volunteers match your search.",
                    modifier = Modifier.padding(20.dp),
                    color = TextSecondary
                )
            }

            else -> filtered.forEach { volunteer ->
                val history = applicationsState.data.filter { it.uid == volunteer.uid }
                VolunteerDirectoryCard(volunteer, history)
            }
        }
    }
}

@Composable
private fun VolunteerDirectoryCard(
    volunteer: VolunteerProfile,
    applicationHistory: List<VolunteerApplication>
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                volunteer.name.ifBlank { "Unnamed volunteer" },
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            if (volunteer.callSign.isNotBlank()) {
                Text("Call sign: ${volunteer.callSign}", style = MaterialTheme.typography.bodySmall, color = GreenPrimary)
            }
            if (volunteer.email.isNotBlank()) Text(volunteer.email, style = MaterialTheme.typography.bodyMedium)
            if (volunteer.phone.isNotBlank()) Text(volunteer.phone, style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
            if (volunteer.address.isNotBlank()) Text(volunteer.address, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            if (volunteer.bio.isNotBlank()) Text(volunteer.bio, style = MaterialTheme.typography.bodyMedium)
            if (volunteer.skills.isNotEmpty()) {
                Text("Skills", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                Text(volunteer.skills.joinToString(" · "), style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            }
            if (volunteer.availability.isNotEmpty()) {
                Text("Availability: ${volunteer.availability.joinToString(", ")}", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            }
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Text("Application history (${applicationHistory.size})", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
            if (applicationHistory.isEmpty()) {
                Text("No applications recorded.", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            } else {
                applicationHistory.sortedByDescending { it.createdAt }.forEach { application ->
                    val applicationLabel = application.missionTitle.ifBlank { "General volunteer application" }
                    Text("$applicationLabel · ${application.status.replaceFirstChar { it.uppercase() }}", style = MaterialTheme.typography.bodySmall)
                    if (application.createdAt.isNotBlank()) {
                        Text(application.createdAt, style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                    }
                }
            }
            Text("Profile ID: ${volunteer.uid}", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
        }
    }
}
