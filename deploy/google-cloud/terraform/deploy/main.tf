provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

module "backend" {
  source = "./modules/backend"

  region                    = var.region
  backend_image             = var.backend_image
  jwt_issuer                = "https://${var.domain}"
  jwt_seconds_to_expiration = 86400
}

resource "google_compute_address" "load_balancer" {
  name = "load-balancer-address"
}

module "load_balancer" {
  source = "./modules/load_balancer"

  region          = var.region
  ip_address      = google_compute_address.load_balancer.address
  domain          = var.domain
  backend_service = module.backend.service
}
