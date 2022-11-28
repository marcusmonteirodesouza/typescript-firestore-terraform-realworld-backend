locals {
  backend_image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.conduit[0].repository_id}/backend"
}

# Artifact Registry
resource "google_artifact_registry_repository" "conduit" {
  count         = var.set_build_pipeline ? 1 : 0
  project       = module.project.project_id
  location      = var.region
  repository_id = "conduit"
  format        = "DOCKER"
}

# Build Pipeline
resource "google_cloudbuild_trigger" "build" {
  count       = var.set_build_pipeline ? 1 : 0
  project     = module.project.project_id
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
    _TFSTATE_BUCKET = module.project.tfstate_bucket
    _REGION         = var.region
    _DOMAIN         = var.domain
    _BACKEND_IMAGE  = local.backend_image
  }
}

# Tag Pipeline
resource "google_cloudbuild_trigger" "tag" {
  count       = var.set_build_pipeline ? 1 : 0
  project     = var.project_id
  name        = "tag-github-tag-commit"
  description = "Tag Pipeline - GitHub Repository Tag Commit ${var.github_repo_commit_tag}"

  github {
    owner = var.github_repo_owner
    name  = var.github_repo_name
    push {
      tag = var.github_repo_commit_tag
    }
  }

  filename = "deploy/google-cloud/cloudbuild/cloudbuild.tag.yaml"

  substitutions = {
    _BACKEND_IMAGE = local.backend_image
  }
}
