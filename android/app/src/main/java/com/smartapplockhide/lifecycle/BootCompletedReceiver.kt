package com.smartapplockhide.lifecycle

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.smartapplockhide.security.NativeSessionRepository
import com.smartapplockhide.security.ProtectionMetadataRepository
import com.smartapplockhide.security.TransientAccessRepository

class BootCompletedReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Intent.ACTION_BOOT_COMPLETED) {
      return
    }

    val appContext = context.applicationContext
    val now = System.currentTimeMillis()
    val transientAccessRepository = TransientAccessRepository(appContext)
    val nativeSessionRepository = NativeSessionRepository(appContext)
    val protectionMetadataRepository = ProtectionMetadataRepository(appContext)

    val transientAccess = transientAccessRepository.read()
    if (transientAccess != null && transientAccess.expiresAt <= now) {
      transientAccessRepository.clear()
    }

    val nativeSession = nativeSessionRepository.read()
    if (nativeSession != null && !nativeSession.immediateRelock && nativeSession.expiresAt <= now) {
      nativeSessionRepository.clear()
    }

    val pendingPackage = protectionMetadataRepository.getPendingAuthRequest()?.packageName
    if (pendingPackage != null && protectionMetadataRepository.readProtection(pendingPackage) == null) {
      protectionMetadataRepository.clearPendingAuthRequest()
    }
  }
}
