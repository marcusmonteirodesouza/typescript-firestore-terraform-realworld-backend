terraform {
  required_providers {
    google = {
      version = "4.43.0"
      source  = "hashicorp/google"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "2.20.2"
    }
  }
}
