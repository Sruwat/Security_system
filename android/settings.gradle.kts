pluginManagement {
  repositories {
    google()
    mavenCentral()
    gradlePluginPortal()
  }
  includeBuild("../node_modules/@react-native/gradle-plugin")
}

plugins {
  id("com.facebook.react.settings")
}

extensions.configure<com.facebook.react.ReactSettingsExtension> {
  autolinkLibrariesFromCommand()
}

dependencyResolutionManagement {
  repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
  repositories {
    google()
    mavenCentral()
  }
}

rootProject.name = "SmartAppLockHide"
include(":app")
