
package io.trezor.rnusb

import android.app.Activity
import android.os.Bundle
import android.util.Log
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class ReactNativeUsbReactActivityLifecycleListener : ReactActivityLifecycleListener {
  override fun onDestroy(activity: Activity) {
      Log.e(LOG_TAG, "XXX onDestroy! XXX")
      super.onDestroy(activity)

  }
}
