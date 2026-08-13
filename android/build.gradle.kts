plugins {
  id("com.android.application") version "8.10.1" apply false
  id("com.android.library") version "8.10.1" apply false
  id("org.jetbrains.kotlin.android") version "2.1.0" apply false
  id("com.facebook.react.rootproject")
}

extra["minSdkVersion"] = 24
extra["compileSdkVersion"] = 36
extra["targetSdkVersion"] = 36
extra["ndkVersion"] = "27.1.12297006"
