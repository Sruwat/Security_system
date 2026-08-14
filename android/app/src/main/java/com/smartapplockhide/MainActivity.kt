package com.smartapplockhide

import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
  override fun getMainComponentName(): String = "SmartAppLockHide"

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
  }

  override fun onResume() {
    super.onResume()
    window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
  }

  override fun onDestroy() {
    window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
    super.onDestroy()
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    // Keep the activity on the stable delegate path if the new-architecture
    // feature flags cannot initialize on the connected device.
    return DefaultReactActivityDelegate(
      this,
      mainComponentName,
      false
    )
  }
}
