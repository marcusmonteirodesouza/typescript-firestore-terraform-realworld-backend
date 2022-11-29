locals {
  enable_apis = [
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com"
  ]

  backend_image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.realworld.repository_id}/backend"
}

# Create Project
resource "google_project" "project" {
  name                = var.project_name
  project_id          = var.project_id
  folder_id           = var.folder_id
  billing_account     = var.billing_account
  auto_create_network = false
}

# Terraform state bucket
resource "random_pet" "tfstate_bucket" {
  length = 4
}

resource "google_storage_bucket" "tfstate" {
  project  = google_project.project.project_id
  name     = random_pet.tfstate_bucket.id
  location = var.region

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }
}

# Enable APIs
resource "google_project_service" "enable_apis" {
  for_each                   = toset(local.enable_apis)
  project                    = google_project.project.project_id
  service                    = each.value
  disable_dependent_services = true
}

# Artifact Registry
resource "google_artifact_registry_repository" "realworld" {
  project       = google_project.project.project_id
  location      = var.region
  repository_id = "realworld"
  format        = "DOCKER"

  depends_on = [
    google_project_service.enable_apis
  ]
}

# Save terraform.tfvars in Secret Manager
resource "google_secret_manager_secret" "tfvars" {
  project   = google_project.project.project_id
  secret_id = "terraform-tfvars"

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }

  depends_on = [
    google_project_service.enable_apis
  ]
}

resource "google_secret_manager_secret_version" "tfvars" {
  secret      = google_secret_manager_secret.tfvars.id
  secret_data = file("${path.module}/../../terraform.tfvars")
}
