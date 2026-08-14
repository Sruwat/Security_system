package com.smartapplockhide.launcher

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager

class LaunchCoordinator(private val context: Context) {
  fun launchApp(packageName: String) {
    val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName)
      ?: throw IllegalArgumentException("No launchable activity found for $packageName.")

    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(launchIntent)
  }

  fun listLaunchableApps(): List<String> {
    val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
    return context.packageManager.queryIntentActivities(intent, PackageManager.MATCH_ALL)
      .mapNotNull { it.activityInfo?.packageName }
      .distinct()
  }
}
