package com.smartapplockhide.device

data class DeviceCapabilities(
  val biometricsAvailable: Boolean,
  val biometricTypes: List<String>,
  val secureScreenSupported: Boolean,
  val packageVisibilityRestricted: Boolean,
)

class DeviceCapabilityProvider {
  fun getCapabilities(): DeviceCapabilities {
    return DeviceCapabilities(
      biometricsAvailable = false,
      biometricTypes = emptyList(),
      secureScreenSupported = false,
      packageVisibilityRestricted = false,
    )
  }
}
