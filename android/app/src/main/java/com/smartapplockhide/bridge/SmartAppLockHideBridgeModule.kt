package com.smartapplockhide.bridge

import android.app.AppOpsManager
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.smartapplockhide.biometric.BiometricAuthenticator
import com.smartapplockhide.device.DeviceCapabilityProvider
import com.smartapplockhide.launcher.LaunchCoordinator
import com.smartapplockhide.security.NativeSessionRepository
import com.smartapplockhide.security.ProtectionMetadataRepository
import com.smartapplockhide.security.SecurityRepository
import com.smartapplockhide.security.TransientAccessRepository
import androidx.fragment.app.FragmentActivity
import com.smartapplockhide.accessibility.ForegroundProtectionAccessibilityService

class SmartAppLockHideBridgeModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val securityRepository = SecurityRepository(context.applicationContext)
  private val launchCoordinator = LaunchCoordinator(context.applicationContext)
  private val capabilityProvider = DeviceCapabilityProvider(context.applicationContext)
  private val biometricAuthenticator = BiometricAuthenticator(context.applicationContext)
  private val transientAccessRepository = TransientAccessRepository(context.applicationContext)
  private val protectionMetadataRepository = ProtectionMetadataRepository(context.applicationContext)
  private val nativeSessionRepository = NativeSessionRepository(context.applicationContext)
  private val sensorManager = context.getSystemService(SensorManager::class.java)
  private var shakeListener: SensorEventListener? = null
  private var lastShakeAt: Long = 0L

  override fun getName(): String = "SmartAppLockHideBridge"

  @ReactMethod
  fun getLaunchableApps(promise: Promise) {
    try {
      val intent = Intent(Intent.ACTION_MAIN).apply {
        addCategory(Intent.CATEGORY_LAUNCHER)
      }
      val apps = context.packageManager.queryIntentActivities(intent, PackageManager.MATCH_ALL)
        .mapNotNull { resolveInfo ->
          val activityInfo = resolveInfo.activityInfo ?: return@mapNotNull null
          if (activityInfo.packageName == context.packageName) {
            return@mapNotNull null
          }

          val label = resolveInfo.loadLabel(context.packageManager)?.toString()
            ?.trim()
            ?.ifEmpty { activityInfo.packageName }
            ?: activityInfo.packageName
          val isSystemApp = activityInfo.applicationInfo.flags and ApplicationInfo.FLAG_SYSTEM != 0
          Triple(activityInfo.packageName, label, isSystemApp)
        }
        .distinctBy { it.first }
        .map { (packageName, label, isSystemApp) ->
          val iconUri = runCatching {
            context.packageManager.getApplicationIcon(packageName)?.let(::drawableToDataUri)
          }.getOrNull()

          Arguments.createMap().apply {
            putString("packageName", packageName)
            putString("label", label)
            putString("iconUri", iconUri)
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
  fun createCredential(ref: String, type: String, value: String, promise: Promise) {
    try {
      securityRepository.createCredential(ref, type, value)
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("CREDENTIAL_CREATE_FAILED", error)
    }
  }

  @ReactMethod
  fun verifyCredential(ref: String, value: String, promise: Promise) {
    try {
      promise.resolve(securityRepository.verifyCredential(ref, value))
    } catch (error: Throwable) {
      promise.reject("CREDENTIAL_VERIFY_FAILED", error)
    }
  }

  @ReactMethod
  fun deleteCredential(ref: String, promise: Promise) {
    try {
      securityRepository.deleteCredential(ref)
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("CREDENTIAL_DELETE_FAILED", error)
    }
  }

  @ReactMethod
  fun authenticateBiometric(promise: Promise) {
    try {
      val activity = context.currentActivity
      if (activity !is FragmentActivity) {
        promise.resolve("unavailable")
        return
      }

      biometricAuthenticator.authenticate(
        activity = activity,
        onSuccess = { promise.resolve("success") },
        onFailure = { promise.resolve("fail") },
        onUnavailable = { promise.resolve("unavailable") },
      )
    } catch (error: Throwable) {
      promise.resolve("unavailable")
    }
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
  fun persistTransientAccess(packageName: String?, vaultUnlocked: Boolean, expiresAt: Double, promise: Promise) {
    try {
      transientAccessRepository.persist(packageName, vaultUnlocked, expiresAt.toLong())
      if (!vaultUnlocked && packageName != null) {
        val expiresAtLong = expiresAt.toLong()
        val now = System.currentTimeMillis()
        nativeSessionRepository.persist(
          packageName = packageName,
          unlockedAt = now,
          expiresAt = expiresAtLong,
          immediateRelock = expiresAtLong >= Long.MAX_VALUE / 2,
        )
        protectionMetadataRepository.clearPendingAuthRequest()
      }
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("TRANSIENT_ACCESS_PERSIST_FAILED", error)
    }
  }

  @ReactMethod
  fun clearTransientAccess(promise: Promise) {
    try {
      transientAccessRepository.clear()
      nativeSessionRepository.clear()
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("TRANSIENT_ACCESS_CLEAR_FAILED", error)
    }
  }

  @ReactMethod
  fun getTransientAccess(promise: Promise) {
    try {
      val state = transientAccessRepository.read()
      if (state == null) {
        promise.resolve(null)
        return
      }

      promise.resolve(Arguments.createMap().apply {
        putString("packageName", state.packageName)
        putBoolean("vaultUnlocked", state.vaultUnlocked)
        putDouble("expiresAt", state.expiresAt.toDouble())
      })
    } catch (error: Throwable) {
      promise.reject("TRANSIENT_ACCESS_READ_FAILED", error)
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

  @ReactMethod
  fun syncProtectionMetadata(protections: ReadableArray, promise: Promise) {
    try {
      val items = buildList {
        for (index in 0 until protections.size()) {
          val item = protections.getMap(index) ?: continue
          val packageName = item.getString("packageName") ?: continue
          val credentialRef = item.getString("credentialRef") ?: continue
          add(
            ProtectionMetadataRepository.ProtectionMetadata(
              packageName = packageName,
              isLocked = item.getBoolean("isLocked"),
              credentialRef = credentialRef,
              lockType = item.getString("lockType") ?: "PIN",
              autoLockTimeoutSeconds = item.getInt("autoLockSeconds"),
              enabled = item.getBoolean("enabled"),
            ),
          )
        }
      }
      protectionMetadataRepository.replaceAll(items)
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("SYNC_PROTECTION_METADATA_FAILED", error)
    }
  }

  @ReactMethod
  fun getPendingAuthRequest(promise: Promise) {
    try {
      val pending = protectionMetadataRepository.getPendingAuthRequest()
      if (pending == null) {
        promise.resolve(null)
        return
      }
      promise.resolve(Arguments.createMap().apply {
        putString("packageName", pending.packageName)
        putDouble("createdAt", pending.createdAt.toDouble())
      })
    } catch (error: Throwable) {
      promise.reject("PENDING_AUTH_READ_FAILED", error)
    }
  }

  @ReactMethod
  fun clearPendingAuthRequest(promise: Promise) {
    try {
      protectionMetadataRepository.clearPendingAuthRequest()
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("PENDING_AUTH_CLEAR_FAILED", error)
    }
  }

  @ReactMethod
  fun getInstalledPackages(promise: Promise) {
    try {
      val packages = context.packageManager.getInstalledApplications(PackageManager.MATCH_ALL)
        .map { it.packageName }
        .distinct()
        .sorted()
      promise.resolve(Arguments.createArray().apply {
        packages.forEach { pushString(it) }
      })
    } catch (error: Throwable) {
      promise.reject("INSTALLED_PACKAGES_FAILED", error)
    }
  }

  @ReactMethod
  fun getLauncherState(promise: Promise) {
    try {
      val state = launchCoordinator.getLauncherState()
      promise.resolve(Arguments.createMap().apply {
        putBoolean("isDefaultLauncher", state.isDefaultLauncher)
        putString("activeDisguise", state.activeDisguise)
      })
    } catch (error: Throwable) {
      promise.reject("LAUNCHER_STATE_FAILED", error)
    }
  }

  @ReactMethod
  fun requestLauncherSelection(promise: Promise) {
    try {
      launchCoordinator.requestLauncherSelection()
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("LAUNCHER_SELECTION_FAILED", error)
    }
  }

  @ReactMethod
  fun setLauncherDisguise(disguiseType: String, promise: Promise) {
    try {
      val state = launchCoordinator.setLauncherDisguise(disguiseType)
      promise.resolve(Arguments.createMap().apply {
        putBoolean("isDefaultLauncher", state.isDefaultLauncher)
        putString("activeDisguise", state.activeDisguise)
      })
    } catch (error: Throwable) {
      promise.reject("LAUNCHER_DISGUISE_FAILED", error)
    }
  }

  @ReactMethod
  fun getPermissionStatuses(promise: Promise) {
    try {
      val statuses = listOf(
        permissionStatus(
          key = "defaultLauncher",
          label = "Default Launcher",
          status = if (launchCoordinator.getLauncherState().isDefaultLauncher) "enabled" else "not_enabled",
          settingsAction = "home",
        ),
        permissionStatus(
          key = "usageAccess",
          label = "Usage Access",
          status = if (hasUsageAccess()) "enabled" else "required",
          settingsAction = "usage_access",
        ),
        permissionStatus(
          key = "accessibility",
          label = "Accessibility",
          status = if (isAccessibilityEnabled()) "enabled" else "required",
          settingsAction = "accessibility",
        ),
        permissionStatus(
          key = "backgroundProtection",
          label = "Background Protection",
          status = if (isAccessibilityEnabled()) "running" else "needs_attention",
          settingsAction = "battery_optimization",
        ),
        permissionStatus(
          key = "batteryOptimization",
          label = "Battery Optimization",
          status = if (isIgnoringBatteryOptimizations()) "recommended_exception" else "optimized",
          settingsAction = "battery_optimization",
        ),
      )

      promise.resolve(Arguments.createArray().apply {
        statuses.forEach { pushMap(it) }
      })
    } catch (error: Throwable) {
      promise.reject("PERMISSION_STATUS_FAILED", error)
    }
  }

  @ReactMethod
  fun openSystemSetting(action: String, promise: Promise) {
    try {
      val intent = when (action) {
        "home" -> Intent(Settings.ACTION_HOME_SETTINGS)
        "usage_access" -> Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        "accessibility" -> Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        "battery_optimization" -> {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
          } else {
            Intent(Settings.ACTION_SETTINGS)
          }
        }
        else -> Intent(Settings.ACTION_SETTINGS)
      }

      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("OPEN_SYSTEM_SETTING_FAILED", error)
    }
  }

  @ReactMethod
  fun startShakeMonitoring(promise: Promise) {
    try {
      if (shakeListener != null) {
        promise.resolve(null)
        return
      }

      val accelerometer = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
      if (sensorManager == null || accelerometer == null) {
        promise.resolve(null)
        return
      }

      shakeListener = object : SensorEventListener {
        override fun onSensorChanged(event: SensorEvent?) {
          val values = event?.values ?: return
          val x = values.getOrNull(0) ?: return
          val y = values.getOrNull(1) ?: return
          val z = values.getOrNull(2) ?: return
          val gX = x / SensorManager.GRAVITY_EARTH
          val gY = y / SensorManager.GRAVITY_EARTH
          val gZ = z / SensorManager.GRAVITY_EARTH
          val force = kotlin.math.sqrt(gX * gX + gY * gY + gZ * gZ)
          val now = System.currentTimeMillis()
          if (force < SHAKE_THRESHOLD_G || now - lastShakeAt < SHAKE_COOLDOWN_MS) {
            return
          }
          lastShakeAt = now
          context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("secretShakeDetected", null)
        }

        override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit
      }

      sensorManager.registerListener(shakeListener, accelerometer, SensorManager.SENSOR_DELAY_UI)
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("SHAKE_START_FAILED", error)
    }
  }

  @ReactMethod
  fun stopShakeMonitoring(promise: Promise) {
    try {
      shakeListener?.let { sensorManager?.unregisterListener(it) }
      shakeListener = null
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("SHAKE_STOP_FAILED", error)
    }
  }

  private fun permissionStatus(
    key: String,
    label: String,
    status: String,
    settingsAction: String,
  ) = Arguments.createMap().apply {
    putString("key", key)
    putString("label", label)
    putString("status", status)
    putString("settingsAction", settingsAction)
  }

  private fun hasUsageAccess(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
      return true
    }

    val appOpsManager = context.getSystemService(AppOpsManager::class.java) ?: return false
    val mode = appOpsManager.unsafeCheckOpNoThrow(
      AppOpsManager.OPSTR_GET_USAGE_STATS,
      android.os.Process.myUid(),
      context.packageName,
    )
    return mode == AppOpsManager.MODE_ALLOWED
  }

  private fun isAccessibilityEnabled(): Boolean {
    val expectedService = "${context.packageName}/${ForegroundProtectionAccessibilityService::class.java.name}"
    val enabledServices = Settings.Secure.getString(
      context.contentResolver,
      Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
    ) ?: return false
    return enabledServices.split(':').any { it.equals(expectedService, ignoreCase = true) }
  }

  private fun isIgnoringBatteryOptimizations(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      return true
    }

    val powerManager = context.getSystemService(PowerManager::class.java) ?: return false
    return powerManager.isIgnoringBatteryOptimizations(context.packageName)
  }

  private fun drawableToDataUri(drawable: Drawable): String? {
    val bitmap = when (drawable) {
      is BitmapDrawable -> drawable.bitmap
      else -> {
        val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 128
        val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 128
        Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888).also { bitmap ->
          val canvas = Canvas(bitmap)
          drawable.setBounds(0, 0, canvas.width, canvas.height)
          drawable.draw(canvas)
        }
      }
    }

    val output = java.io.ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)
    val encoded = Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP)
    return "data:image/png;base64,$encoded"
  }

  companion object {
    private const val SHAKE_THRESHOLD_G = 2.25f
    private const val SHAKE_COOLDOWN_MS = 1800L
  }
}
