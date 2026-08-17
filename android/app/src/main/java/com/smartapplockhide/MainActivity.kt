package com.smartapplockhide

import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
  override fun getMainComponentName(): String = "SmartAppLockHide"

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
    window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
  }

  override fun onResume() {
    super.onResume()
    window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
  }

  override fun onNewIntent(intent: android.content.Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
  }

  override fun onDestroy() {
    window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
    super.onDestroy()
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
  }

  companion object {
    const val ACTION_AUTH_GATE = "com.smartapplockhide.action.AUTH_GATE"
    const val EXTRA_PENDING_PACKAGE_NAME = "pendingPackageName"
  }
}
