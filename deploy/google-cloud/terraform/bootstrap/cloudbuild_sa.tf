locals {
  cloudbuild_sa_email = "${data.google_project.project.number}@cloudbuild.gserviceaccount.com"

  cloudbuild_sa_project_roles = [
    "roles/compute.admin",
    "roles/datastore.indexAdmin",
    "roles/iam.securityAdmin",
    "roles/iam.serviceAccountCreator",
    "roles/iam.serviceAccountUser",
    "roles/run.admin",
    "roles/secretmanager.admin"
  ]
}

data "google_project" "project" {
  project_id = module.project.project_id
}

# Cloud Build Service Account Roles
resource "google_project_iam_member" "cloudbuild_sa" {
  for_each = toset(local.cloudbuild_sa_project_roles)
  project  = module.project.project_id
  role     = each.value
  member   = "serviceAccount:${local.cloudbuild_sa_email}"
}
