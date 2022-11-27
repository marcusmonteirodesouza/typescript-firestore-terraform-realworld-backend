variable "region" {
  type        = string
  description = "The default region to manage resources in. If another region is specified on a regional resource, it will take precedence."
}

variable "backend_image" {
  type        = string
  description = "The Backend Docker image."
}

variable "jwt_issuer" {
  type        = string
  description = "The party that creates and signs the JWT token."
}

variable "jwt_seconds_to_expiration" {
  type        = number
  description = "The number of seconds a newly issued JWT token will be valid for."
}
