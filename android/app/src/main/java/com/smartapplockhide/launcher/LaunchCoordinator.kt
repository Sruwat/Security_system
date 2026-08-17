package com.smartapplockhide.launcher

import android.app.role.RoleManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings

class LaunchCoordinator(private val context: Context) {
  data class LauncherState(
    val isDefaultLauncher: Boolean,
    val activeDisguise: String,
  )

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

  fun getLauncherState(): LauncherState {
    return LauncherState(
      isDefaultLauncher = isDefaultLauncher(),
      activeDisguise = getActiveDisguise(),
    )
  }

  fun requestLauncherSelection() {
    val roleManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      context.getSystemService(RoleManager::class.java)
    } else {
      null
    }

    val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q &&
      roleManager != null &&
      roleManager.isRoleAvailable(RoleManager.ROLE_HOME)
    ) {
      roleManager.createRequestRoleIntent(RoleManager.ROLE_HOME)
    } else {
      Intent(Settings.ACTION_HOME_SETTINGS)
    }

    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
  }

  fun setLauncherDisguise(disguiseType: String): LauncherState {
    val componentMap = mapOf(
      "default" to ComponentName(context, DEFAULT_ALIAS),
      "calculator" to ComponentName(context, CALCULATOR_ALIAS),
      "clock" to ComponentName(context, CLOCK_ALIAS),
      "calendar" to ComponentName(context, CALENDAR_ALIAS),
      "gallery" to ComponentName(context, GALLERY_ALIAS),
    )
    val target = componentMap[disguiseType] ?: componentMap.getValue("default")
    val packageManager = context.packageManager

    componentMap.values.forEach { component ->
      val state = if (component == target) {
        PackageManager.COMPONENT_ENABLED_STATE_ENABLED
      } else {
        PackageManager.COMPONENT_ENABLED_STATE_DISABLED
      }
      packageManager.setComponentEnabledSetting(
        component,
        state,
        PackageManager.DONT_KILL_APP,
      )
    }

    return getLauncherState()
  }

  private fun isDefaultLauncher(): Boolean {
    val homeIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
    val resolved = context.packageManager.resolveActivity(homeIntent, PackageManager.MATCH_DEFAULT_ONLY)
      ?.activityInfo
      ?.packageName
      ?: return false
    return resolved == context.packageName
  }

  private fun getActiveDisguise(): String {
    val packageManager = context.packageManager
    val aliases = listOf(
      "default" to ComponentName(context, DEFAULT_ALIAS),
      "calculator" to ComponentName(context, CALCULATOR_ALIAS),
      "clock" to ComponentName(context, CLOCK_ALIAS),
      "calendar" to ComponentName(context, CALENDAR_ALIAS),
      "gallery" to ComponentName(context, GALLERY_ALIAS),
    )

    return aliases.firstOrNull { (_, component) ->
      packageManager.getComponentEnabledSetting(component) != PackageManager.COMPONENT_ENABLED_STATE_DISABLED
    }?.first ?: "default"
  }

  companion object {
    private const val DEFAULT_ALIAS = "com.smartapplockhide.DefaultLauncherAlias"
    private const val CALCULATOR_ALIAS = "com.smartapplockhide.CalculatorLauncherAlias"
    private const val CLOCK_ALIAS = "com.smartapplockhide.ClockLauncherAlias"
    private const val CALENDAR_ALIAS = "com.smartapplockhide.CalendarLauncherAlias"
    private const val GALLERY_ALIAS = "com.smartapplockhide.GalleryLauncherAlias"
  }
}
