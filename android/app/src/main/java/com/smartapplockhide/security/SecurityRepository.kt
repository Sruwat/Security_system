package com.smartapplockhide.security

class SecurityRepository {
  fun createCredential(type: String, value: String) {
    throw UnsupportedOperationException("Native security repository is not implemented yet.")
  }

  fun verifyCredential(type: String, value: String): Boolean {
    throw UnsupportedOperationException("Native security repository is not implemented yet.")
  }
}
