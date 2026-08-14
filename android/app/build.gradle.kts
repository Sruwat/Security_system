import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
  id("com.facebook.react")
}

android {
  namespace = "com.smartapplockhide"
  compileSdk = 36

  defaultConfig {
    applicationId = "com.smartapplockhide"
    minSdk = 24
    targetSdk = 36
    versionCode = 1
    versionName = "1.0.0"
    vectorDrawables.useSupportLibrary = true
  }

  signingConfigs {
    getByName("debug") {
      storeFile = file("${rootProject.projectDir}/debug.keystore")
      storePassword = "android"
      keyAlias = "androiddebugkey"
      keyPassword = "android"
    }
  }

  buildTypes {
    debug {
      isMinifyEnabled = false
      signingConfig = signingConfigs.getByName("debug")
    }
    release {
      isMinifyEnabled = false
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
      signingConfig = signingConfigs.getByName("debug")
    }
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  buildFeatures {
    buildConfig = true
  }

  packaging {
    resources {
      excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
  }

  lint {
    abortOnError = false
  }
}

kotlin {
  compilerOptions {
    jvmTarget.set(JvmTarget.JVM_17)
  }
}

react {
  root = file("../../")
  reactNativeDir = file("../../node_modules/react-native")
  codegenDir = file("../../node_modules/@react-native/codegen")
  autolinkLibrariesWithApp()
}

dependencies {
  implementation("com.facebook.react:react-android")
  implementation("com.facebook.react:hermes-android")
  implementation("androidx.biometric:biometric:1.1.0")
}
