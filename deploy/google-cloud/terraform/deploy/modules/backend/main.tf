data "google_project" "project" {
}

# JWT Secret Key
resource "random_password" "jwt_secret_key" {
  length = 64
}

resource "google_secret_manager_secret" "jwt_secret_key" {
  secret_id = "jwt-secret-key"

  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "jwt_secret_key" {
  secret      = google_secret_manager_secret.jwt_secret_key.id
  secret_data = random_password.jwt_secret_key.result
}

# Cloud Run Service Account
resource "google_service_account" "backend" {
  account_id   = "backend-cloud-run-sa"
  display_name = "Backend Cloud Run Service Account"
}

resource "google_secret_manager_secret_iam_member" "backend_sa_jwt_secret_key_access" {
  secret_id = google_secret_manager_secret.jwt_secret_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend.email}"
}

# Cloud Run Service
resource "google_cloud_run_service" "backend" {
  name     = "backend"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.backend.email

      containers {
        image = var.backend_image

        env {
          name  = "FIRESTORE_PROJECT_ID"
          value = data.google_project.project.project_id
        }
        env {
          name  = "JWT_ISSUER"
          value = var.jwt_issuer
        }
        env {
          name  = "JWT_SECONDS_TO_EXPIRATION"
          value = var.jwt_seconds_to_expiration
        }
        env {
          name = "JWT_SECRET_KEY"
          value_from {
            secret_key_ref {
              key  = "latest"
              name = google_secret_manager_secret.jwt_secret_key.secret_id
            }
          }
        }
      }
    }
  }

  metadata {
    annotations = {
      "run.googleapis.com/ingress" = "internal-and-cloud-load-balancing"
    }
  }

  depends_on = [
    google_secret_manager_secret_iam_member.backend_sa_jwt_secret_key_access
  ]
}

resource "google_cloud_run_service_iam_member" "allow_unauthenticated" {
  location = google_cloud_run_service.backend.location
  project  = google_cloud_run_service.backend.project
  service  = google_cloud_run_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
