package com.smartapplockhide.security

import android.content.Context

class NativeSessionRepository(context: Context) {
  private val preferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  data class SessionState(
    val packageName: String,
    val unlockedAt: Long,
    val expiresAt: Long,
    val immediateRelock: Boolean,
  )

  fun read(): SessionState? {
    val packageName = preferences.getString(KEY_PACKAGE_NAME, null) ?: return null
    return SessionState(
      packageName = packageName,
      unlockedAt = preferences.getLong(KEY_UNLOCKED_AT, 0L),
      expiresAt = preferences.getLong(KEY_EXPIRES_AT, 0L),
      immediateRelock = preferences.getBoolean(KEY_IMMEDIATE_RELOCK, false),
    )
  }

  fun persist(packageName: String, unlockedAt: Long, expiresAt: Long, immediateRelock: Boolean) {
    preferences.edit()
      .putString(KEY_PACKAGE_NAME, packageName)
      .putLong(KEY_UNLOCKED_AT, unlockedAt)
      .putLong(KEY_EXPIRES_AT, expiresAt)
      .putBoolean(KEY_IMMEDIATE_RELOCK, immediateRelock)
      .apply()
  }

  fun isValidFor(packageName: String, now: Long = System.currentTimeMillis()): Boolean {
    val state = read() ?: return false
    if (state.packageName != packageName) {
      return false
    }
    if (state.immediateRelock) {
      return true
    }
    return state.expiresAt > now
  }

  fun clear() {
    preferences.edit().clear().apply()
  }

  companion object {
    private const val PREFS_NAME = "smart_app_lock_hide_native_session"
    private const val KEY_PACKAGE_NAME = "package_name"
    private const val KEY_UNLOCKED_AT = "unlocked_at"
    private const val KEY_EXPIRES_AT = "expires_at"
    private const val KEY_IMMEDIATE_RELOCK = "immediate_relock"
  }
}
