# Only a project's Owner can create App Engine applications https://cloud.google.com/appengine/docs/standard/python/roles#primitive_roles
resource "google_app_engine_application" "firestore" {
  project       = var.project_id
  location_id   = var.region
  database_type = "CLOUD_FIRESTORE"
}
