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

# Deployment Pipeline
resource "google_cloudbuild_trigger" "deployment" {
  project     = var.project_id
  name        = "deployment-github-tag-commit"
  description = "Deployment Pipeline - GitHub Repository Tag Commit ${var.github_repo_commit_tag}"

  github {
    owner = var.github_repo_owner
    name  = var.github_repo_name
    push {
      tag = var.github_repo_commit_tag
    }
  }

  filename = "deployment/google-cloud/cloudbuild/cloudbuild.deployment.yaml"

  substitutions = {
    _TFSTATE_BUCKET = google_storage_bucket.tfstate.name
    _REGION         = var.region
    _DOMAIN         = var.domain
    _BACKEND_IMAGE  = var.backend_image
  }
}
