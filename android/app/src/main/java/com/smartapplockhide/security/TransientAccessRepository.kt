package com.smartapplockhide.security

import android.content.Context

class TransientAccessRepository(context: Context) {
  private val preferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  data class TransientAccessState(
    val packageName: String?,
    val vaultUnlocked: Boolean,
    val expiresAt: Long,
  )

  fun persist(packageName: String?, vaultUnlocked: Boolean, expiresAt: Long) {
    preferences.edit()
      .putString(KEY_PACKAGE_NAME, packageName)
      .putBoolean(KEY_VAULT_UNLOCKED, vaultUnlocked)
      .putLong(KEY_EXPIRES_AT, expiresAt)
      .apply()
  }

  fun read(): TransientAccessState? {
    if (!preferences.contains(KEY_EXPIRES_AT) && !preferences.contains(KEY_VAULT_UNLOCKED) && !preferences.contains(KEY_PACKAGE_NAME)) {
      return null
    }

    return TransientAccessState(
      packageName = preferences.getString(KEY_PACKAGE_NAME, null),
      vaultUnlocked = preferences.getBoolean(KEY_VAULT_UNLOCKED, false),
      expiresAt = preferences.getLong(KEY_EXPIRES_AT, 0L),
    )
  }

  fun clear() {
    preferences.edit().clear().apply()
  }

  companion object {
    private const val PREFS_NAME = "smart_app_lock_hide_transient_access"
    private const val KEY_PACKAGE_NAME = "package_name"
    private const val KEY_VAULT_UNLOCKED = "vault_unlocked"
    private const val KEY_EXPIRES_AT = "expires_at"
  }
}
