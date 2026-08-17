package com.smartapplockhide.accessibility

import android.accessibilityservice.AccessibilityService
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.view.accessibility.AccessibilityEvent
import com.smartapplockhide.MainActivity
import com.smartapplockhide.security.NativeSessionRepository
import com.smartapplockhide.security.ProtectionMetadataRepository

class ForegroundProtectionAccessibilityService : AccessibilityService() {
  private lateinit var protectionMetadataRepository: ProtectionMetadataRepository
  private lateinit var nativeSessionRepository: NativeSessionRepository
  private var lastForegroundPackage: String? = null
  private var lastInterceptionPackage: String? = null
  private var lastInterceptionAt: Long = 0L

  private val screenOffReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      if (intent?.action == Intent.ACTION_SCREEN_OFF) {
        nativeSessionRepository.clear()
      }
    }
  }

  override fun onServiceConnected() {
    super.onServiceConnected()
    protectionMetadataRepository = ProtectionMetadataRepository(applicationContext)
    nativeSessionRepository = NativeSessionRepository(applicationContext)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      registerReceiver(screenOffReceiver, IntentFilter(Intent.ACTION_SCREEN_OFF), RECEIVER_NOT_EXPORTED)
    } else {
      @Suppress("DEPRECATION")
      registerReceiver(screenOffReceiver, IntentFilter(Intent.ACTION_SCREEN_OFF))
    }
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null) {
      return
    }

    if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
      event.eventType != AccessibilityEvent.TYPE_WINDOWS_CHANGED
    ) {
      return
    }

    val packageName = event.packageName?.toString()?.takeIf { it.isNotBlank() } ?: return
    if (shouldIgnorePackage(packageName)) {
      return
    }

    handleImmediateRelockOnPackageChange(packageName)

    val protection = protectionMetadataRepository.readProtection(packageName)
      ?.takeIf { it.enabled && it.isLocked }
      ?: run {
        lastForegroundPackage = packageName
        return
      }

    if (nativeSessionRepository.isValidFor(packageName)) {
      lastForegroundPackage = packageName
      return
    }

    val now = System.currentTimeMillis()
    val pending = protectionMetadataRepository.getPendingAuthRequest()
    if (pending?.packageName == packageName && now - pending.createdAt < 1500L) {
      lastForegroundPackage = packageName
      return
    }

    if (lastInterceptionPackage == packageName && now - lastInterceptionAt < 1200L) {
      lastForegroundPackage = packageName
      return
    }

    protectionMetadataRepository.setPendingAuthRequest(packageName)
    lastInterceptionPackage = packageName
    lastInterceptionAt = now
    lastForegroundPackage = packageName

    startActivity(
      Intent(this, MainActivity::class.java).apply {
        action = MainActivity.ACTION_AUTH_GATE
        putExtra(MainActivity.EXTRA_PENDING_PACKAGE_NAME, packageName)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      },
    )
  }

  override fun onInterrupt() {
    // No-op.
  }

  override fun onDestroy() {
    runCatching {
      unregisterReceiver(screenOffReceiver)
    }
    super.onDestroy()
  }

  private fun handleImmediateRelockOnPackageChange(currentPackageName: String) {
    val session = nativeSessionRepository.read() ?: return
    if (!session.immediateRelock) {
      return
    }
    if (session.packageName != currentPackageName && lastForegroundPackage == session.packageName) {
      nativeSessionRepository.clear()
    }
  }

  private fun shouldIgnorePackage(packageName: String): Boolean {
    if (packageName == applicationContext.packageName) {
      return true
    }

    if (packageName == "com.android.systemui" || packageName == "android") {
      return true
    }

    if (packageName.startsWith("com.android.settings")) {
      return true
    }

    if (packageName.startsWith("com.google.android.permissioncontroller")) {
      return true
    }

    return false
  }
}
