locals {
  enable_apis = [
    "cloudbuild.googleapis.com",
    "firestore.googleapis.com"
  ]

  cloudbuild_sa_email = "${google_project.project.number}@cloudbuild.gserviceaccount.com"

  cloudbuild_sa_project_roles = [
    "roles/iam.securityAdmin",
  ]
}

# Create Project
resource "google_project" "project" {
  name                = var.project_name
  project_id          = var.project_id
  folder_id           = var.folder_id
  billing_account     = var.billing_account
  auto_create_network = false
}

# Enable APIs
resource "google_project_service" "enable_apis" {
  for_each                   = toset(local.enable_apis)
  project                    = google_project.project.project_id
  service                    = each.value
  disable_dependent_services = true
}

# Cloud Build Service Account Roles
resource "google_project_iam_member" "cloudbuild_sa" {
  for_each = toset(local.cloudbuild_sa_project_roles)
  project  = google_project.project.project_id
  role     = each.value
  member   = "serviceAccount:${local.cloudbuild_sa_email}"

  depends_on = [
    google_project_service.enable_apis
  ]
}

resource "google_artifact_registry_repository_iam_member" "member" {
  project    = var.bootstrap_project_id
  location   = var.region
  repository = var.bootstrap_project_artifact_registry_repository
  role       = "roles/artifactregistry.repoAdmin"
  member     = "serviceAccount:${local.cloudbuild_sa_email}"

  depends_on = [
    google_project_service.enable_apis
  ]
}

# Only a project's Owner can create App Engine applications https://cloud.google.com/appengine/docs/standard/python/roles#primitive_roles
resource "google_app_engine_application" "firestore" {
  project       = google_project.project.project_id
  location_id   = var.region
  database_type = "CLOUD_FIRESTORE"

  depends_on = [
    google_project_service.enable_apis
  ]
}
