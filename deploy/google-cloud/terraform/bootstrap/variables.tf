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

variable "domain" {
  type        = string
  description = "The domain name."
}

variable "set_build_pipeline" {
  type        = bool
  description = "Set to true if you want to set a Build Pipeline on this project."
}

variable "github_repo_owner" {
  default     = ""
  description = "Owner of the Github repository. Only used if set_build_pipeline is true."
}

variable "github_repo_name" {
  default     = ""
  description = "Name of the Github repository. Only used if set_build_pipeline is true."
}

variable "github_repo_branch" {
  default     = ""
  description = "Regex of branches to match to trigger a build. Only used if set_build_pipeline is true."
}

variable "github_repo_commit_tag" {
  default     = ""
  description = "Regex of tags to match to trigger a Tag pipeline. Only used if set_build_pipeline is true."
}
