## firmwareUpdate

Installs a new firmware

```javascript
const result = await TrezorConnect.firmwareUpdate(params);
```

### Params

[Optional common params](commonParams.md)

#### You either provide binary

-   `binary` — _required_ `bytes`

#### Or params

-   `version`: _required_ `number[]` version of firmware to be installed
-   `btcOnly`: `boolean` should install bitcoin only or regular firmware
-   `baseUrl`: `string` url to look for releases.json
-   `intermediary`: `boolean` should install intermediary firmware

### Notable firmware ranges

It is not possible to install directly whatever version of a new firmware in all cases. Some specific firmware
versions might be installed only on device which already run a version which is not lower then x.y.z.
These rules are generally expressed by `bootloader_version` and `min_bootloader_version` in [releases.json document](https://data.trezor.io/firmware/t1b1/releases.json)

Here is a list of notable firmware ranges. `1.11.1` was the latest firmware at the time of writing this docs.

Firmware versions `latest` - `1.7.1`

-   can be installed only on devices with firmware 1.6.2 and higher

Firmware versions `1.6.3` - `1.0.0`

-   can not be updated to the latest firmware using single `TrezorConnect.firmwareUpdate` call
-   if device has one of these firmwares, `TrezorConnect.firmwareUpdate` should be called with `intermediary: true` which would install a special intermediary firmware first and automatically switch device into bootloader mode making it ready to accept another firmware update
-   alternatively, you may call `TrezorConnect.firmwareUpdate` with `version: '1.6.3'` and after succeeding retry this call with `version: '1.11.1'`

Bootloader versions `latest` - `1.8.0`

-   the first 256 byte (containing old firmware header) must sliced off the when installing a new firmware on bootloader versions in this range.
-   TrezorConnect takes care of this automatically

Firmwares `1.7.2` - `1.6.2`

-   These can be updated to the latest firmware in one `TrezorConnect.firmwareUpdate` call (this is apparent from bullets above).
-   Old firmware headers MUST NOT be sliced off when installing new firmwares onto these versions as these versions have lower bootloader than 1.8.0.
-   For the purpose of computing firmware hash of a newly installed firmware, we **MUST** slice off old firmware headers.

### Example

```javascript
TrezorConnect.firmwareUpdate({
    version: '2.5.1',
});
```

### Result

[FirmwareUpdateResponse type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/firmwareUpdate.ts)

```javascript
{
    success: true,
    payload: {
        // challenge used to compute expected firmware hash. only with firmware 1.11.1 and 2.5.1 or higher
        challenge: string,
        // expected firmware hash computed from the installed binary. only with firmware 1.11.1 and 2.5.1 or higher
        hash: string,

    }
}
```

Error

```javascript
{
    success: false,
    payload: {
        error: string // error message
    }
}
```
