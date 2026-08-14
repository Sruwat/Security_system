package com.smartapplockhide.device

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.biometric.BiometricManager

data class DeviceCapabilities(
  val biometricsAvailable: Boolean,
  val biometricTypes: List<String>,
  val secureScreenSupported: Boolean,
  val packageVisibilityRestricted: Boolean,
)

class DeviceCapabilityProvider(private val context: Context) {
  fun getCapabilities(): DeviceCapabilities {
    val packageManager = context.packageManager
    val biometricManager = BiometricManager.from(context)
    val biometricTypes = buildList {
      if (packageManager.hasSystemFeature(PackageManager.FEATURE_FINGERPRINT)) {
        add("FINGERPRINT")
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && packageManager.hasSystemFeature(PackageManager.FEATURE_FACE)) {
        add("FACE")
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && packageManager.hasSystemFeature(PackageManager.FEATURE_IRIS)) {
        add("IRIS")
      }
    }

    return DeviceCapabilities(
      biometricsAvailable = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_WEAK) == BiometricManager.BIOMETRIC_SUCCESS,
      biometricTypes = biometricTypes,
      secureScreenSupported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1,
      packageVisibilityRestricted = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R,
    )
  }
}
