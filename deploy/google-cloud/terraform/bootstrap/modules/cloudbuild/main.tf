resource "google_cloudbuild_trigger" "push_to_branch" {
  project     = var.project_id
  name        = "github-push-to-${var.github_repo_branch}"
  description = "GitHub Repository Trigger ${var.github_repo_owner}/${var.github_repo_name} (${var.github_repo_branch})"
  location    = var.region

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
  }
}

resource "google_cloudbuild_trigger" "tag_commit" {
  project     = var.project_id
  name        = "github-tag-commit"
  description = "GitHub Repository Tag Commit Trigger ${var.github_repo_commit_tag}"
  location    = var.region

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
  }
}
