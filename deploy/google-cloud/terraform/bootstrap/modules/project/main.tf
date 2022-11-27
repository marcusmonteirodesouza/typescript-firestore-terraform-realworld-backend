locals {
  enable_apis = [
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "secretmanager.googleapis.com",
    "run.googleapis.com"
  ]
}

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
