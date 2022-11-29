locals {
  environments = [var.development, var.production]
}

module "bootstrap_project" {
  source = "./modules/bootstrap_project"

  folder_id       = var.bootstrap.folder_id
  project_name    = var.bootstrap.project_name
  project_id      = var.bootstrap.project_id
  billing_account = var.bootstrap.billing_account
  region          = var.bootstrap.region
}

module "project" {
  for_each = { for environment in local.environments : environment.environment => environment }

  source = "./modules/project"

  folder_id                                      = each.value.folder_id
  project_name                                   = each.value.project_name
  project_id                                     = each.value.project_id
  billing_account                                = each.value.billing_account
  region                                         = each.value.region
  bootstrap_project_id                           = module.bootstrap_project.project_id
  bootstrap_project_artifact_registry_repository = module.bootstrap_project.artifact_registry_repository
}

module "build_pipeline" {
  source = "./modules/build_pipeline"

  project_id             = module.project["development"].project_id
  region                 = var.development.region
  github_repo_owner      = var.github_repo_owner
  github_repo_name       = var.github_repo_name
  github_repo_branch     = var.github_repo_branch
  github_repo_commit_tag = var.github_repo_commit_tag
  domain                 = var.development.domain
  backend_image          = module.bootstrap_project.backend_image
}

module "deployment_pipeline" {
  source = "./modules/deployment_pipeline"

  project_id             = module.project["production"].project_id
  region                 = var.development.region
  github_repo_owner      = var.github_repo_owner
  github_repo_name       = var.github_repo_name
  github_repo_commit_tag = var.github_repo_commit_tag
  domain                 = var.development.domain
  backend_image          = module.bootstrap_project.backend_image
}
