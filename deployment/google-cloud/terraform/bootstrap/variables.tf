variable "bootstrap" {
  type = object({
    folder_id       = string
    billing_account = string
    project_name    = string
    project_id      = string
    region          = string
  })
  description = "The Bootstrap project configuration."
}

variable "development" {
  type = object({
    environment     = string
    folder_id       = string
    billing_account = string
    project_name    = string
    project_id      = string
    region          = string
    domain          = string # The web domain name
  })
  description = "The Development project configuration."
}

variable "production" {
  type = object({
    environment     = string
    folder_id       = string
    billing_account = string
    project_name    = string
    project_id      = string
    region          = string
    domain          = string # The web domain name
  })
  description = "The Production project configuration."
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
