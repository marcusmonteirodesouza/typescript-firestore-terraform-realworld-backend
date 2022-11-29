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

variable "bootstrap_project_id" {
  type        = string
  description = "The Bootstrap project ID."
}

variable "bootstrap_project_artifact_registry_repository" {
  type        = string
  description = "The Bootstrap project's Artifact Registry Repository ID."
}
