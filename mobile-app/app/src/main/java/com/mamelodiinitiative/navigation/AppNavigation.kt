package com.mamelodiinitiative.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.mamelodiinitiative.auth.AuthViewModel
import com.mamelodiinitiative.ui.components.BottomNavBar
import com.mamelodiinitiative.ui.screens.AboutScreen
import com.mamelodiinitiative.ui.screens.ContactScreen
import com.mamelodiinitiative.ui.screens.DonateScreen
import com.mamelodiinitiative.ui.screens.HomeScreen
import com.mamelodiinitiative.ui.screens.ManagerApplicationsScreen
import com.mamelodiinitiative.ui.screens.ManagerDashboardScreen
import com.mamelodiinitiative.ui.screens.ManagerProgrammeEditScreen
import com.mamelodiinitiative.ui.screens.MoreScreen
import com.mamelodiinitiative.ui.screens.NewsDetailScreen
import com.mamelodiinitiative.ui.screens.NewsScreen
import com.mamelodiinitiative.ui.screens.ProgrammeDetailScreen
import com.mamelodiinitiative.ui.screens.ProgrammesScreen
import com.mamelodiinitiative.ui.screens.VolunteerApplicationScreen
import com.mamelodiinitiative.ui.screens.VolunteerReviewScreen
import com.mamelodiinitiative.ui.screens.VolunteerScreen
import com.mamelodiinitiative.ui.screens.VolunteerSuccessScreen
import com.mamelodiinitiative.viewmodel.ContactViewModel
import com.mamelodiinitiative.viewmodel.MainViewModel
import com.mamelodiinitiative.viewmodel.ManagerViewModel
import com.mamelodiinitiative.viewmodel.VolunteerViewModel

@Composable
fun AppNavigation(
    onLogout: () -> Unit,
    navController: NavHostController = rememberNavController(),
    authViewModel: AuthViewModel = viewModel(),
    volunteerViewModel: VolunteerViewModel = viewModel(),
    mainViewModel: MainViewModel = viewModel(),
    contactViewModel: ContactViewModel = viewModel(),
    managerViewModel: ManagerViewModel = viewModel()
) {
    val authUiState by authViewModel.uiState.collectAsState()
    val volunteerUiState by volunteerViewModel.uiState.collectAsState()
    val programmesState by mainViewModel.programmesState.collectAsState()
    val newsState by mainViewModel.newsState.collectAsState()

    val navItems = getNavItemsForRole(authUiState.profile?.role)

    Scaffold(
        bottomBar = {
            BottomNavBar(navController, navItems)
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Routes.HOME,
            modifier = Modifier.padding(padding)
        ) {
            composable(Routes.HOME) {
                HomeScreen(
                    programmesState = programmesState,
                    newsState = newsState,
                    onNavigate = navController::navigate
                )
            }

            composable(Routes.PROGRAMMES) {
                ProgrammesScreen(
                    state = programmesState,
                    onNavigate = navController::navigate
                )
            }

            composable(
                route = Routes.PROGRAMME_DETAIL,
                arguments = listOf(
                    navArgument("programmeId") {
                        type = NavType.StringType
                    }
                )
            ) { entry ->
                ProgrammeDetailScreen(
                    programmeId = entry.arguments?.getString("programmeId") ?: "",
                    programmes = programmesState.data,
                    onBack = { navController.popBackStack() },
                    onNavigate = navController::navigate
                )
            }

            composable(Routes.VOLUNTEER) {
                VolunteerScreen(
                    onNavigate = navController::navigate,
                    uiState = volunteerUiState
                )
            }

            composable(Routes.VOLUNTEER_FORM) {
                VolunteerApplicationScreen(
                    application = volunteerUiState.application,
                    onChange = volunteerViewModel::updateApplication,
                    onBack = { navController.popBackStack() },
                    onReview = {
                        navController.navigate(Routes.VOLUNTEER_REVIEW)
                    }
                )
            }

            composable(Routes.VOLUNTEER_REVIEW) {
                VolunteerReviewScreen(
                    state = volunteerUiState,
                    onEdit = { navController.popBackStack() },
                    onSubmit = volunteerViewModel::submitApplication,
                    onSuccess = {
                        navController.navigate(Routes.VOLUNTEER_SUCCESS)
                    }
                )
            }

            composable(Routes.VOLUNTEER_SUCCESS) {
                VolunteerSuccessScreen(
                    onNavigate = { route ->
                        volunteerViewModel.resetApplication()
                        navController.navigate(route) {
                            popUpTo(Routes.HOME) {
                                inclusive = false
                            }
                            launchSingleTop = true
                        }
                    }
                )
            }

            composable(Routes.NEWS) {
                NewsScreen(
                    state = newsState,
                    onNavigate = navController::navigate
                )
            }

            composable(
                route = Routes.NEWS_DETAIL,
                arguments = listOf(
                    navArgument("newsId") {
                        type = NavType.StringType
                    }
                )
            ) { entry ->
                NewsDetailScreen(
                    newsId = entry.arguments?.getString("newsId") ?: "",
                    newsList = newsState.data,
                    onBack = { navController.popBackStack() },
                    onNavigate = navController::navigate
                )
            }

            composable(Routes.MORE) {
                MoreScreen(
                    onNavigate = navController::navigate,
                    onLogout = onLogout,
                    userRole = authUiState.profile?.role
                )
            }

            composable(Routes.ABOUT) {
                AboutScreen(
                    onBack = { navController.popBackStack() },
                    onNavigate = navController::navigate
                )
            }

            composable(Routes.DONATE) {
                DonateScreen(
                    onBack = { navController.popBackStack() },
                    onNavigate = navController::navigate
                )
            }

            composable(Routes.CONTACT) {
                ContactScreen(
                    onBack = { navController.popBackStack() },
                    onNavigate = navController::navigate,
                    contactViewModel = contactViewModel
                )
            }

            // Manager Routes
            composable(Routes.MANAGER_DASHBOARD) {
                ManagerDashboardScreen(
                    onNavigate = navController::navigate,
                    managerViewModel = managerViewModel
                )
            }

            composable(Routes.MANAGER_APPLICATIONS) {
                ManagerApplicationsScreen(
                    onBack = { navController.popBackStack() },
                    managerViewModel = managerViewModel
                )
            }

            composable(
                route = Routes.MANAGER_PROGRAMME_EDIT,
                arguments = listOf(
                    navArgument("docId") {
                        type = NavType.StringType
                    }
                )
            ) { entry ->
                ManagerProgrammeEditScreen(
                    docId = entry.arguments?.getString("docId") ?: "new",
                    onBack = { navController.popBackStack() },
                    managerViewModel = managerViewModel
                )
            }
        }
    }
}
