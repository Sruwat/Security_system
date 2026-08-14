package com.smartapplockhide

import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import android.view.KeyEvent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactRootView
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import com.facebook.react.modules.core.PermissionListener

/**
 * Legacy-only delegate that avoids React Native bridgeless/new-architecture feature flags.
 *
 * The connected device is missing the new-architecture JNI library, so we bootstrap the classic
 * React root view directly from ReactInstanceManager and keep all lifecycle callbacks on the
 * bridge-backed path.
 */
class LegacyReactActivityDelegate(
  activity: ReactActivity,
  private val mainComponentName: String
) : ReactActivityDelegate(activity, mainComponentName) {
  private var reactRootView: ReactRootView? = null
  private var permissionListener: PermissionListener? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    val activity = getPlainActivity()
    val reactNativeHost = getReactNativeHost()
    val reactInstanceManager = reactNativeHost.reactInstanceManager

    if (reactRootView == null) {
      reactRootView = ReactRootView(activity)
      reactRootView?.startReactApplication(
        reactInstanceManager,
        mainComponentName,
        getLaunchOptions()
      )
    }

    activity.setContentView(requireNotNull(reactRootView))
  }

  override fun onResume() {
    val activity = getPlainActivity()
    getReactNativeHost().reactInstanceManager.onHostResume(
      activity,
      activity as DefaultHardwareBackBtnHandler
    )
  }

  override fun onPause() {
    getReactNativeHost().reactInstanceManager.onHostPause(getPlainActivity())
  }

  override fun onDestroy() {
    reactRootView?.unmountReactApplication()
    reactRootView = null
    getReactNativeHost().reactInstanceManager.onHostDestroy(getPlainActivity())
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    getReactNativeHost().reactInstanceManager.onActivityResult(
      getPlainActivity(),
      requestCode,
      resultCode,
      data
    )
  }

  override fun onNewIntent(intent: Intent): Boolean {
    getReactNativeHost().reactInstanceManager.onNewIntent(intent)
    return true
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    getReactNativeHost().reactInstanceManager.onWindowFocusChange(hasFocus)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    getReactNativeHost().reactInstanceManager.onConfigurationChanged(
      getPlainActivity(),
      newConfig
    )
  }

  override fun onBackPressed(): Boolean {
    getReactNativeHost().reactInstanceManager.onBackPressed()
    return true
  }

  override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
    return false
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    return false
  }

  override fun onKeyLongPress(keyCode: Int, event: KeyEvent): Boolean {
    return false
  }

  override fun requestPermissions(
    permissions: Array<String>,
    requestCode: Int,
    listener: PermissionListener?
  ) {
    permissionListener = listener
    getPlainActivity().requestPermissions(permissions, requestCode)
  }

  override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<String>,
    grantResults: IntArray
  ) {
    permissionListener?.let { listener ->
      if (listener.onRequestPermissionsResult(requestCode, permissions, grantResults)) {
        permissionListener = null
      }
    }
  }
}
