package com.smartapplockhide.biometric

import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity

class BiometricAuthenticator(private val context: Context) {
  fun authenticate(
    activity: FragmentActivity,
    onSuccess: () -> Unit,
    onFailure: () -> Unit,
    onUnavailable: () -> Unit,
  ) {
    val biometricManager = BiometricManager.from(context)
    if (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_WEAK) != BiometricManager.BIOMETRIC_SUCCESS) {
      onUnavailable()
      return
    }

    val executor = ContextCompat.getMainExecutor(context)
    val promptInfo = BiometricPrompt.PromptInfo.Builder()
      .setTitle("Unlock Private Apps")
      .setSubtitle("Use biometrics to continue.")
      .setNegativeButtonText("Cancel")
      .build()

    val prompt = BiometricPrompt(activity, executor, object : BiometricPrompt.AuthenticationCallback() {
      override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
        onSuccess()
      }

      override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
        if (errorCode == BiometricPrompt.ERROR_NO_BIOMETRICS || errorCode == BiometricPrompt.ERROR_HW_UNAVAILABLE) {
          onUnavailable()
        } else {
          onFailure()
        }
      }

      override fun onAuthenticationFailed() {
        onFailure()
      }
    })

    prompt.authenticate(promptInfo)
  }
}
