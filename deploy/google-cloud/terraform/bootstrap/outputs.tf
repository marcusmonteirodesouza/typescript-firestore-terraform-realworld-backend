output "tfstate_bucket" {
  value       = module.project.tfstate_bucket
  description = "The GCS bucket in which the project's terraform state is stored."
}

output "tfvars_secret" {
  value       = google_secret_manager_secret.bootstrap_tfvars.secret_id
  description = "The ID of the Secret in which the last used terraform.tfvars file contents is stored."
}
