locals {
  backend_image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.conduit.repository_id}/backend"
}

resource "google_artifact_registry_repository" "conduit" {
  project       = var.project_id
  location      = var.region
  repository_id = "conduit"
  format        = "DOCKER"
}
