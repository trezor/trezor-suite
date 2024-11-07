# Development on Windows

Thanks to Windows Subsystem for Linux (WSL), you can run Trezor Suite dev environment on a Windows machine.

## Prerequisites

On Windows:

-   [Install an Ubuntu WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) _(must be v2, you may upgrade existing v1 WSL to v2)_
-   Install [USBIPD](https://learn.microsoft.com/en-us/windows/wsl/connect-usb)

In WSL:

-   Run `sudo apt-get install build-essential`
-   Install these [Electron dependencies](https://www.electronjs.org/docs/latest/development/build-instructions-linux) for Linux
-   Install udev rules [as per the Trezor docs](https://trezor.io/learn/a/udev-rules)

## Setup

Proceed with the [general readme instructions](../../README.md#trezor-suite-trezorsuite).

## Connecting USB device

On Windows, run `usbipd list`, find the bus id of the Trezor device, e.g. `2-1`.

Then run:

```
usbipd bind --busid 2-1
usbipd attach --wsl --busid 2-1
```

In WSL, run `lsusb` to confirm the device is visible.

_Note: Without udev rules, the device will be visible by `lsusb`, but not in the app._
