output "tfstate_bucket" {
  value       = module.bootstrap_project.tfstate_bucket
  description = "The GCS bucket in which the bootstrap terraform state is stored."
}

output "tfvars_secret" {
  value       = module.bootstrap_project.tfvars_secret
  description = "The ID of the Secret in which the last used terraform.tfvars file contents is stored."
}
