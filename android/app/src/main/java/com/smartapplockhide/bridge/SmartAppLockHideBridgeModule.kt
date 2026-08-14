package com.smartapplockhide.bridge

import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.smartapplockhide.device.DeviceCapabilityProvider
import com.smartapplockhide.launcher.LaunchCoordinator
import com.smartapplockhide.security.SecurityRepository

class SmartAppLockHideBridgeModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val securityRepository = SecurityRepository(context.applicationContext)
  private val launchCoordinator = LaunchCoordinator(context.applicationContext)
  private val capabilityProvider = DeviceCapabilityProvider(context.applicationContext)

  override fun getName(): String = "SmartAppLockHideBridge"

  @ReactMethod
  fun getLaunchableApps(promise: Promise) {
    try {
      val intent = Intent(Intent.ACTION_MAIN).apply {
        addCategory(Intent.CATEGORY_LAUNCHER)
      }
      val apps = context.packageManager.queryIntentActivities(intent, PackageManager.MATCH_ALL)
        .map { resolveInfo ->
          val activityInfo = resolveInfo.activityInfo
          val label = resolveInfo.loadLabel(context.packageManager)?.toString()
            ?: activityInfo.packageName
          val isSystemApp = activityInfo.applicationInfo.flags and ApplicationInfo.FLAG_SYSTEM != 0
          Arguments.createMap().apply {
            putString("packageName", activityInfo.packageName)
            putString("label", label)
            putBoolean("systemApp", isSystemApp)
          }
        }
        .sortedBy { it.getString("label").orEmpty().lowercase() }

      promise.resolve(Arguments.createArray().apply {
        apps.forEach { pushMap(it) }
      })
    } catch (error: Throwable) {
      promise.reject("APP_DISCOVERY_FAILED", error)
    }
  }

  @ReactMethod
  fun launchApp(packageName: String, promise: Promise) {
    try {
      launchCoordinator.launchApp(packageName)
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("LAUNCH_FAILED", error)
    }
  }

  @ReactMethod
  fun createCredential(type: String, value: String, promise: Promise) {
    try {
      securityRepository.createCredential(type, value)
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("CREDENTIAL_CREATE_FAILED", error)
    }
  }

  @ReactMethod
  fun verifyCredential(type: String, value: String, promise: Promise) {
    try {
      promise.resolve(securityRepository.verifyCredential(type, value))
    } catch (error: Throwable) {
      promise.reject("CREDENTIAL_VERIFY_FAILED", error)
    }
  }

  @ReactMethod
  fun authenticateBiometric(promise: Promise) {
    promise.resolve("unavailable")
  }

  @ReactMethod
  fun setSecureScreen(enabled: Boolean, promise: Promise) {
    try {
      val activity = context.currentActivity
      if (activity != null) {
        val window = activity.window
        if (enabled) {
          window.addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE)
        } else {
          window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE)
        }
      }
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("SECURE_SCREEN_FAILED", error)
    }
  }

  @ReactMethod
  fun getDeviceCapabilities(promise: Promise) {
    val map = Arguments.createMap().apply {
      val capabilities = capabilityProvider.getCapabilities()
      putBoolean("biometricsAvailable", capabilities.biometricsAvailable)
      putArray("biometricTypes", Arguments.createArray().apply {
        capabilities.biometricTypes.forEach { pushString(it) }
      })
      putBoolean("secureScreenSupported", capabilities.secureScreenSupported)
      putBoolean("packageVisibilityRestricted", capabilities.packageVisibilityRestricted)
    }
    promise.resolve(map)
  }
}
