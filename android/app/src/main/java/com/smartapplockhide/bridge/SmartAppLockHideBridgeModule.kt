package com.smartapplockhide.bridge

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SmartAppLockHideBridgeModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName(): String = "SmartAppLockHideBridge"

  @ReactMethod
  fun getLaunchableApps(promise: Promise) {
    promise.resolve(Arguments.createArray())
  }

  @ReactMethod
  fun launchApp(packageName: String, promise: Promise) {
    promise.reject("NOT_IMPLEMENTED", "launchApp is not implemented yet.")
  }

  @ReactMethod
  fun createCredential(type: String, value: String, promise: Promise) {
    promise.reject("NOT_IMPLEMENTED", "createCredential is not implemented yet.")
  }

  @ReactMethod
  fun verifyCredential(type: String, value: String, promise: Promise) {
    promise.reject("NOT_IMPLEMENTED", "verifyCredential is not implemented yet.")
  }

  @ReactMethod
  fun authenticateBiometric(promise: Promise) {
    promise.resolve("unavailable")
  }

  @ReactMethod
  fun setSecureScreen(enabled: Boolean, promise: Promise) {
    promise.resolve(null)
  }

  @ReactMethod
  fun getDeviceCapabilities(promise: Promise) {
    val map = Arguments.createMap().apply {
      putBoolean("biometricsAvailable", false)
      putArray("biometricTypes", Arguments.createArray())
      putBoolean("secureScreenSupported", false)
      putBoolean("packageVisibilityRestricted", false)
    }
    promise.resolve(map)
  }
}
