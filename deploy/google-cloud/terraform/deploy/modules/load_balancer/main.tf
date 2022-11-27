data "google_project" "project" {
}

resource "google_compute_region_network_endpoint_group" "backend_serverless_neg" {
  name                  = "backend-neg"
  region                = var.region
  network_endpoint_type = "SERVERLESS"
  cloud_run {
    service = var.backend_service
  }
}

module "https_load_balancer" {
  source         = "GoogleCloudPlatform/lb-http/google//modules/serverless_negs"
  version        = "~> 6.3"
  name           = "https-load-balancer"
  project        = data.google_project.project.project_id
  address        = var.ip_address
  create_address = false

  ssl                             = true
  managed_ssl_certificate_domains = [var.domain]
  https_redirect                  = true

  backends = {
    default = {
      description = null
      groups = [
        {
          group = google_compute_region_network_endpoint_group.backend_serverless_neg.id
        }
      ]
      enable_cdn              = false
      security_policy         = null
      custom_request_headers  = null
      custom_response_headers = null

      iap_config = {
        enable               = false
        oauth2_client_id     = ""
        oauth2_client_secret = ""
      }
      log_config = {
        enable      = false
        sample_rate = null
      }
    }
  }
}
