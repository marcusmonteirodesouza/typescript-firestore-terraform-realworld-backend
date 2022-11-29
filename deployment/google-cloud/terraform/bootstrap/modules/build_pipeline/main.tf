# Terraform state bucket
resource "random_pet" "tfstate_bucket" {
  length = 4
}

resource "google_storage_bucket" "tfstate" {
  project  = var.project_id
  name     = random_pet.tfstate_bucket.id
  location = var.region

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }
}

# Build Pipeline
resource "google_cloudbuild_trigger" "build" {
  project     = var.project_id
  name        = "build-github-push-to-${var.github_repo_branch}"
  description = "Build and Push Pipeline - GitHub Repository Push to Branch ${var.github_repo_owner}/${var.github_repo_name} (${var.github_repo_branch})"

  github {
    owner = var.github_repo_owner
    name  = var.github_repo_name
    push {
      branch = var.github_repo_branch
    }
  }

  filename = "deploy/google-cloud/cloudbuild/cloudbuild.build.yaml"

  substitutions = {
    _TFSTATE_BUCKET = google_storage_bucket.tfstate.name
    _REGION         = var.region
    _DOMAIN         = var.domain
    _BACKEND_IMAGE  = var.backend_image
  }
}
