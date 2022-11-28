module "project" {
  source = "./modules/project"

  folder_id       = var.folder_id
  project_name    = var.project_name
  project_id      = var.project_id
  billing_account = var.billing_account
  region          = var.region
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
