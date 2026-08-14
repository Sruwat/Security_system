package com.smartapplockhide.biometric

import android.content.Context
import android.os.Build
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
    val authenticators =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL
      } else {
        BiometricManager.Authenticators.BIOMETRIC_WEAK
      }

    if (biometricManager.canAuthenticate(authenticators) != BiometricManager.BIOMETRIC_SUCCESS) {
      onUnavailable()
      return
    }

    val executor = ContextCompat.getMainExecutor(context)
    val promptInfoBuilder = BiometricPrompt.PromptInfo.Builder()
      .setTitle("Unlock Private Apps")
      .setSubtitle("Use biometrics or device credentials to continue.")

    val promptInfo =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        promptInfoBuilder.setAllowedAuthenticators(authenticators).build()
      } else {
        promptInfoBuilder.setNegativeButtonText("Cancel").build()
      }

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
