output "project_id" {
  value       = google_project.project.project_id
  description = "The created project ID."
}

output "tfstate_bucket" {
  value       = google_storage_bucket.tfstate.name
  description = "The GCS bucket in which the project's terraform state is stored."
}
