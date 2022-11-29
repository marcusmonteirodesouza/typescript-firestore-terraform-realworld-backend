locals {
  enable_apis = [
    "artifactregistry.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com"
  ]

  cloudbuild_sa_email = "${data.google_project.project.number}@cloudbuild.gserviceaccount.com"

  cloudbuild_sa_project_roles = [
    "roles/compute.admin",
    "roles/datastore.owner",
    "roles/iam.serviceAccountCreator",
    "roles/iam.serviceAccountUser",
    "roles/run.admin",
    "roles/secretmanager.admin"
  ]
}

data "google_project" "project" {
  project_id = var.project_id
}

# Enable APIs
resource "google_project_service" "enable_apis" {
  project                    = var.project_id
  for_each                   = toset(local.enable_apis)
  service                    = each.value
  disable_dependent_services = true
}

# Cloud Build Service Account Roles
resource "google_project_iam_member" "cloudbuild_sa" {
  for_each = toset(local.cloudbuild_sa_project_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${local.cloudbuild_sa_email}"
}
