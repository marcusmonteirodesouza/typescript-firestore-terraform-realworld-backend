variable "project_id" {
  type        = string
  description = "The project ID. Changing this forces a new project to be created."
}

variable "region" {
  type        = string
  description = "The default region to manage resources in. If another region is specified on a regional resource, it will take precedence."
}

variable "github_repo_owner" {
  type        = string
  description = "Owner of the Github repository."
}

variable "github_repo_name" {
  type        = string
  description = "Name of the Github repository."
}

variable "github_repo_branch" {
  type        = string
  description = "Regex of branches to match to trigger a Build."
}

variable "github_repo_commit_tag" {
  type        = string
  description = "Regex of tags to match to trigger a Deployment."
}

variable "domain" {
  type        = string
  description = "The domain name."
}

variable "backend_image" {
  type        = string
  description = "The Backend Docker image."
}
