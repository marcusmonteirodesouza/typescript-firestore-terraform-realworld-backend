output "project_id" {
  value       = google_project.project.project_id
  description = "The created project ID."
}

output "tfstate_bucket" {
  value       = google_storage_bucket.tfstate.name
  description = "The GCS bucket in which the bootstrap terraform state is stored."
}

output "tfvars_secret" {
  value       = google_secret_manager_secret.tfvars.secret_id
  description = "The ID of the Secret in which the last used terraform.tfvars file contents is stored."
}

output "artifact_registry_repository" {
  value       = google_artifact_registry_repository.realworld.repository_id
  description = "The Artifact Registry Repository ID."
}

output "backend_image" {
  value       = google_artifact_registry_repository.realworld.repository_id
  description = "The Backend Docker image."
}
