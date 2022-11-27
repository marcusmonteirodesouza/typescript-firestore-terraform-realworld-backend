module "project" {
  source = "./modules/project"

  folder_id       = var.folder_id
  project_name    = var.project_name
  project_id      = var.project_id
  billing_account = var.billing_account
  region          = var.region
}

module "firestore" {
  source = "./modules/firestore"

  project_id = module.project.project_id
  region     = var.region
}

module "cloudbuild" {
  source = "./modules/cloudbuild"

  project_id               = module.project.project_id
  region                   = var.region
  tfstate_bucket           = module.project.tfstate_bucket
  github_repo_owner        = var.github_repo_owner
  github_repo_name         = var.github_repo_name
  github_repo_branch       = var.github_repo_branch
  github_repo_commit_tag   = var.github_repo_commit_tag
  deploy_on_push_to_branch = var.deploy_on_push_to_branch
}

resource "google_secret_manager_secret" "bootstrap_tfvars" {
  project   = module.project.project_id
  secret_id = "bootstrap-terraform-tfvars"

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }

  depends_on = [
    module.project
  ]
}

resource "google_secret_manager_secret_version" "bootstrap_tfvars" {
  secret      = google_secret_manager_secret.bootstrap_tfvars.id
  secret_data = file("${path.module}/terraform.tfvars")
}
