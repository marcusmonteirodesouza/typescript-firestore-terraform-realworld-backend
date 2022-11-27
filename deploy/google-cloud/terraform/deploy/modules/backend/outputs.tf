output "service" {
  value       = google_cloud_run_service.backend.name
  description = "The Backend Cloud Run service name."
}
