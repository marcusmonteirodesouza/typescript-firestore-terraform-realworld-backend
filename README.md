# ![RealWorld Example App](logo.png)

> ### [TypeScript](https://www.typescriptlang.org/) codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://github.com/gothinkster/realworld) spec and API.

### [Demo](https://demo.realworld.io/)&nbsp;&nbsp;&nbsp;&nbsp;[RealWorld](https://github.com/gothinkster/realworld)

This codebase was created to demonstrate a fully fledged backend application built with **[TypeScript](https://www.typescriptlang.org/)** including CRUD operations, authentication, routing, pagination, and more.

We've gone to great lengths to adhere to the **[TypeScript](https://www.typescriptlang.org/)** community styleguides & best practices.

For more information on how to this works with other frontends/backends, head over to the [RealWorld](https://github.com/gothinkster/realworld) repo.

# How it works

> Describe the general architecture of your app here

# Getting started

## Testing

# Deployment

## [Google Cloud](https://cloud.google.com/)

### Bootstrap

1. Create an [Organization](https://cloud.google.com/resource-manager/docs/creating-managing-organization) on Google Cloud.
1. Create a [Folder](https://cloud.google.com/resource-manager/docs/creating-managing-folders) on your Organization to create your projects in.
1. Create a [Billing Account](https://cloud.google.com/billing/docs/how-to/manage-billing-account#create_a_new_billing_account).
1. Install [terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli).
1. Install the [gcloud CLI](https://cloud.google.com/sdk/docs/install).
1. Run [`gcloud auth login`](https://cloud.google.com/sdk/gcloud/reference/auth/login).
1. Run [`gcloud auth application-default login`](https://cloud.google.com/sdk/gcloud/reference/auth/application-default/login).
1. `cd` into the [`deploy/google-cloud/terraform/bootstrap`](./deploy/google-cloud/terraform/bootstrap).
1. Comment out the entire contents of the [`backend.tf`](https://developer.hashicorp.com/terraform/language/settings/backends/gcs) file.
1. Create a [`terraform.tfvars`](https://developer.hashicorp.com/terraform/language/values/variables#variable-definitions-tfvars-files) file and add your variables' values.
1. Run `terraform init`.
1. Run `terraform apply -target=module.bootstrap_project`.
1. Uncomment the `backend.tf` file's contents and update the `bucket` argument to the value of the `tfstate_bucket` output.
1. Run `terraform init` and type `yes`.
1. 1. [Manually connect the Github repositories via the console in CloudBuild](https://cloud.google.com/build/docs/automating-builds/github/connect-repo-github). Do not create a Trigger, just click `DONE` once the repository is connected.
1. Run `terraform apply`.

### Deploy
