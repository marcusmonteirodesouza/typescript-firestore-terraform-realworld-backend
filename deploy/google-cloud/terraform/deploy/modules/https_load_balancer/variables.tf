variable "region" {
  type        = string
  description = "The default region to manage resources in. If another region is specified on a regional resource, it will take precedence."
}

variable "ip_address" {
  type        = string
  description = "The Load Balancer's IP address."
}

variable "domain" {
  type        = string
  description = "The domain name."
}

variable "backend_service" {
  type        = string
  description = "The Backend Cloud Run service name."
}
