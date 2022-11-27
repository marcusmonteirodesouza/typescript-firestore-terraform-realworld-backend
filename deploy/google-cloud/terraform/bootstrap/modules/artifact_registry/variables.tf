variable "project_id" {
  type        = string
  description = "The project ID. Changing this forces a new project to be created."
}

variable "region" {
  type        = string
  description = "The default region to manage resources in. If another region is specified on a regional resource, it will take precedence."
}
