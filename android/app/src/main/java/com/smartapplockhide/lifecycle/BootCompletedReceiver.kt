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
    TransientAccessRepository(appContext).clear()
    NativeSessionRepository(appContext).clear()
    ProtectionMetadataRepository(appContext).clearPendingAuthRequest()
  }
}
