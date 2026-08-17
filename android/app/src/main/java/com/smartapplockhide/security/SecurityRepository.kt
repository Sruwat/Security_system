package com.smartapplockhide.security

import android.content.Context
import android.os.Build
import android.util.Base64
import java.nio.charset.StandardCharsets
import java.security.KeyStore
import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties

class SecurityRepository(context: Context) {
  private val preferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
  private val keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER).apply {
    load(null)
  }
  private val secureRandom = SecureRandom()

  fun createCredential(ref: String, type: String, value: String) {
    require(ref.isNotBlank()) { "Credential ref cannot be blank." }
    require(type.isNotBlank()) { "Credential type cannot be blank." }
    require(value.isNotBlank()) { "Credential value cannot be blank." }

    val salt = ByteArray(16).also(secureRandom::nextBytes)
    val hash = hashCredential(type, value, salt)
    val payload = listOf(
      type,
      Base64.encodeToString(salt, Base64.NO_WRAP),
      Base64.encodeToString(hash, Base64.NO_WRAP),
    ).joinToString(SEPARATOR)

    preferences.edit().putString(storageKey(ref), encrypt(payload)).apply()
  }

  fun verifyCredential(ref: String, value: String): Boolean {
    require(ref.isNotBlank()) { "Credential ref cannot be blank." }
    val encodedPayload = preferences.getString(storageKey(ref), null) ?: return false
    val payload = runCatching { decrypt(encodedPayload) }.getOrNull() ?: return false
    val parts = payload.split(SEPARATOR)
    if (parts.size != 3) {
      return false
    }

    val type = parts[0]
    val salt = runCatching { Base64.decode(parts[1], Base64.NO_WRAP) }.getOrNull() ?: return false
    val expectedHash = runCatching { Base64.decode(parts[2], Base64.NO_WRAP) }.getOrNull() ?: return false
    val actualHash = hashCredential(type, value, salt)
    return MessageDigest.isEqual(expectedHash, actualHash)
  }

  fun deleteCredential(ref: String) {
    require(ref.isNotBlank()) { "Credential ref cannot be blank." }
    preferences.edit().remove(storageKey(ref)).apply()
  }

  private fun storageKey(ref: String): String = "$PREFS_PREFIX$ref"

  private fun hashCredential(type: String, value: String, salt: ByteArray): ByteArray {
    val digest = MessageDigest.getInstance(HASH_ALGORITHM)
    digest.update(salt)
    digest.update(type.toByteArray(StandardCharsets.UTF_8))
    digest.update(VALUE_SEPARATOR.toByteArray(StandardCharsets.UTF_8))
    digest.update(value.toByteArray(StandardCharsets.UTF_8))
    return digest.digest()
  }

  private fun encrypt(payload: String): String {
    val cipher = Cipher.getInstance(TRANSFORMATION)
    cipher.init(Cipher.ENCRYPT_MODE, getOrCreateSecretKey())
    val encrypted = cipher.doFinal(payload.toByteArray(StandardCharsets.UTF_8))
    val iv = cipher.iv
    return "${Base64.encodeToString(iv, Base64.NO_WRAP)}:${
      Base64.encodeToString(encrypted, Base64.NO_WRAP)
    }"
  }

  private fun decrypt(encodedPayload: String): String {
    val parts = encodedPayload.split(":")
    require(parts.size == 2) { "Invalid credential payload." }
    val iv = Base64.decode(parts[0], Base64.NO_WRAP)
    val encrypted = Base64.decode(parts[1], Base64.NO_WRAP)
    val cipher = Cipher.getInstance(TRANSFORMATION)
    cipher.init(Cipher.DECRYPT_MODE, getOrCreateSecretKey(), GCMParameterSpec(GCM_TAG_BITS, iv))
    val decrypted = cipher.doFinal(encrypted)
    return String(decrypted, StandardCharsets.UTF_8)
  }

  private fun getOrCreateSecretKey(): SecretKey {
    val existing = keyStore.getKey(KEY_ALIAS, null)
    if (existing is SecretKey) {
      return existing
    }

    val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE_PROVIDER)
    val spec = KeyGenParameterSpec.Builder(
      KEY_ALIAS,
      KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
    )
      .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
      .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
      .setKeySize(256)
      .build()
    keyGenerator.init(spec)
    return keyGenerator.generateKey()
  }

  companion object {
    private const val PREFS_NAME = "smart_app_lock_hide_security"
    private const val PREFS_PREFIX = "credential_"
    private const val KEY_ALIAS = "smart_app_lock_hide_master_key"
    private const val KEYSTORE_PROVIDER = "AndroidKeyStore"
    private const val HASH_ALGORITHM = "SHA-256"
    private const val TRANSFORMATION = "AES/GCM/NoPadding"
    private const val GCM_TAG_BITS = 128
    private const val SEPARATOR = "|"
    private const val VALUE_SEPARATOR = ":"
  }
}
