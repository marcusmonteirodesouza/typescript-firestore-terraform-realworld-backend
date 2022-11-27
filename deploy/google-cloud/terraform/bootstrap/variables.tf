variable "folder_id" {
  type        = string
  description = "The numeric ID of the folder this project should be created under."
}

variable "project_name" {
  type        = string
  description = "The display name of the project."
}

variable "project_id" {
  type        = string
  description = "The project ID. Changing this forces a new project to be created."
}

variable "billing_account" {
  type        = string
  description = "The alphanumeric ID of the billing account this project belongs to."
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
  description = "Regex of branches to match to trigger a build."
}

variable "github_repo_commit_tag" {
  type        = string
  description = "Regex of tags to match to trigger a deployment."
}

variable "deploy_on_push_to_branch" {
  type        = bool
  description = "Set to true if you want to trigger a deployment when pushing to a branch."
}
