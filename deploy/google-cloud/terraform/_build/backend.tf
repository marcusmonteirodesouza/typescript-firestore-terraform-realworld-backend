terraform {
  backend "gcs" {
    bucket = "probably-secondly-neat-jaybird" # This needs to be passed as backend-config.
    prefix = "build"
  }
}
