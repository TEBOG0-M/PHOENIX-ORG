package com.mamelodiinitiative.navigation

object Routes {
    const val HOME = "home"
    const val PROGRAMMES = "programmes"
    const val PROGRAMME_DETAIL = "programme_detail/{programmeId}"
    const val VOLUNTEER = "volunteer"
    const val VOLUNTEER_FORM = "volunteer_form"
    const val VOLUNTEER_REVIEW = "volunteer_review"
    const val VOLUNTEER_SUCCESS = "volunteer_success"
    const val NEWS = "news"
    const val NEWS_DETAIL = "news_detail/{newsId}"
    const val MORE = "more"
    const val ABOUT = "about"
    const val DONATE = "donate"
    const val CONTACT = "contact"

    // Manager Routes
    const val MANAGER_DASHBOARD = "manager_dashboard"
    const val MANAGER_APPLICATIONS = "manager_applications"
    const val MANAGER_PROGRAMME_EDIT = "manager_programme_edit/{docId}"

    fun programmeDetail(programmeId: String) = "programme_detail/$programmeId"
    fun programmeDetail(id: Int) = "programme_detail/$id"
    fun newsDetail(newsId: String) = "news_detail/$newsId"
    fun newsDetail(id: Int) = "news_detail/$id"
    fun managerProgrammeEdit(docId: String) = "manager_programme_edit/$docId"
}
