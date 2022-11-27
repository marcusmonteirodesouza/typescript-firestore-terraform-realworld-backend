locals {
  cloudbuild_sa_email = "${data.google_project.project.number}@cloudbuild.gserviceaccount.com"

  cloudbuild_sa_project_roles = [
    "roles/compute.admin",
    "roles/datastore.indexAdmin",
    "roles/iam.serviceAccountCreator",
    "roles/iam.serviceAccountUser",
    "roles/run.admin",
    "roles/secretmanager.admin",
  ]
}

data "google_project" "project" {
  project_id = var.project_id
}

# Cloud Build Service Account Roles
resource "google_project_iam_member" "cloudbuild_sa" {
  for_each = toset(local.cloudbuild_sa_project_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${local.cloudbuild_sa_email}"
}

# Cloud Build Triggers
resource "google_cloudbuild_trigger" "push_to_branch" {
  project     = var.project_id
  name        = "github-push-to-${var.github_repo_branch}"
  description = "GitHub Repository Trigger ${var.github_repo_owner}/${var.github_repo_name} (${var.github_repo_branch})"

  github {
    owner = var.github_repo_owner
    name  = var.github_repo_name
    push {
      branch = var.github_repo_branch
    }
  }

  filename = "deploy/google-cloud/cloudbuild/cloudbuild.build.yaml"

  substitutions = {
    _TFSTATE_BUCKET = var.tfstate_bucket
    _DEPLOY         = var.deploy_on_push_to_branch
    _REGION         = var.region
    _DOMAIN         = var.domain
    _BACKEND_IMAGE  = var.backend_image
  }
}

resource "google_cloudbuild_trigger" "tag_commit" {
  project     = var.project_id
  name        = "github-tag-commit"
  description = "GitHub Repository Tag Commit Trigger ${var.github_repo_commit_tag}"

  github {
    owner = var.github_repo_owner
    name  = var.github_repo_name
    push {
      tag = var.github_repo_commit_tag
    }
  }

  filename = "deploy/google-cloud/cloudbuild/cloudbuild.deploy.yaml"

  substitutions = {
    _TFSTATE_BUCKET = var.tfstate_bucket
    _REGION         = var.region
    _DOMAIN         = var.domain
    _BACKEND_IMAGE  = var.backend_image
  }
}
