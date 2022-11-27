provider "google" {
  project = var.project_id
  region  = var.region
}

resource "docker_image" "backend" {
  name = "backend"
  build {
    path = "${path.module}/../../../.."
    tag  = ["${var.backend_image}:${var.git_commit_sha}"]
  }
}

resource "null_resource" "backend_docker_push" {
  provisioner "local-exec" {
    command = "docker push ${var.backend_image}:${var.git_commit_sha}"
  }

  triggers = {
    docker_image_repo_digest = docker_image.backend.repo_digest
  }
}
