package io.trezor.rnusb

import expo.modules.kotlin.exception.CodedException

internal class GetDevicesFail :
        CodedException("'getDevices' failed to retrieve devices or app context", null)
