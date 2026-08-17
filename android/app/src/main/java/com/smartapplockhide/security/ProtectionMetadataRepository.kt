package com.smartapplockhide.security

import android.content.Context

class ProtectionMetadataRepository(context: Context) {
  private val preferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  data class ProtectionMetadata(
    val packageName: String,
    val isLocked: Boolean,
    val credentialRef: String,
    val lockType: String,
    val autoLockTimeoutSeconds: Int,
    val enabled: Boolean,
  )

  data class PendingAuthRequest(
    val packageName: String,
    val createdAt: Long,
  )

  fun list(): List<ProtectionMetadata> {
    val packageNames = preferences.getStringSet(KEY_PACKAGES, emptySet()).orEmpty()
    return packageNames.mapNotNull(::readProtection)
  }

  fun replaceAll(items: List<ProtectionMetadata>) {
    val editor = preferences.edit()
    val existing = preferences.getStringSet(KEY_PACKAGES, emptySet()).orEmpty()
    existing.forEach { packageName ->
      editor.remove(protectionKey(packageName))
    }

    editor.putStringSet(KEY_PACKAGES, items.map { it.packageName }.toSet())
    items.forEach { item ->
      editor.putString(protectionKey(item.packageName), encode(item))
    }
    editor.apply()
  }

  fun readProtection(packageName: String): ProtectionMetadata? {
    val encoded = preferences.getString(protectionKey(packageName), null) ?: return null
    val parts = encoded.split(SEPARATOR)
    if (parts.size != 6) {
      return null
    }

    return ProtectionMetadata(
      packageName = parts[0],
      isLocked = parts[1].toBooleanStrictOrNull() ?: false,
      credentialRef = parts[2],
      lockType = parts[3],
      autoLockTimeoutSeconds = parts[4].toIntOrNull() ?: 30,
      enabled = parts[5].toBooleanStrictOrNull() ?: false,
    )
  }

  fun removeProtection(packageName: String) {
    val nextPackages = preferences.getStringSet(KEY_PACKAGES, emptySet()).orEmpty().toMutableSet().apply {
      remove(packageName)
    }
    preferences.edit()
      .putStringSet(KEY_PACKAGES, nextPackages)
      .remove(protectionKey(packageName))
      .apply()
  }

  fun getPendingAuthRequest(): PendingAuthRequest? {
    val packageName = preferences.getString(KEY_PENDING_PACKAGE, null) ?: return null
    val createdAt = preferences.getLong(KEY_PENDING_CREATED_AT, 0L)
    return PendingAuthRequest(packageName = packageName, createdAt = createdAt)
  }

  fun setPendingAuthRequest(packageName: String) {
    preferences.edit()
      .putString(KEY_PENDING_PACKAGE, packageName)
      .putLong(KEY_PENDING_CREATED_AT, System.currentTimeMillis())
      .apply()
  }

  fun clearPendingAuthRequest() {
    preferences.edit()
      .remove(KEY_PENDING_PACKAGE)
      .remove(KEY_PENDING_CREATED_AT)
      .apply()
  }

  private fun encode(item: ProtectionMetadata): String {
    return listOf(
      item.packageName,
      item.isLocked.toString(),
      item.credentialRef,
      item.lockType,
      item.autoLockTimeoutSeconds.toString(),
      item.enabled.toString(),
    ).joinToString(SEPARATOR)
  }

  private fun protectionKey(packageName: String): String = "$KEY_PROTECTION_PREFIX$packageName"

  companion object {
    private const val PREFS_NAME = "smart_app_lock_hide_protection_metadata"
    private const val KEY_PACKAGES = "packages"
    private const val KEY_PENDING_PACKAGE = "pending_package"
    private const val KEY_PENDING_CREATED_AT = "pending_created_at"
    private const val KEY_PROTECTION_PREFIX = "protection_"
    private const val SEPARATOR = "\u001F"
  }
}
