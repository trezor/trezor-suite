# Development on Windows

This guide will describe two ways how to run Trezor Suite dev environment & build pipeline on a Windows system:<br>
[natively on Windows](#native-windows) or [through WSL](#windows-subsystem-for-linux).

## Native Windows

Running the dev environment natively on Windows is not most straightforward, but it should offer best compatibility.

### Prerequisites

-   Install Python either via the [Python for Windows installer](https://www.python.org/downloads/windows/), or from Microsoft Store
-   Install [latest Visual Studio Community](https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=Community) with C++ build tools
    -   **Make sure** to install the "Desktop development with C++" workload
    -   _FYI: it's necessary so that yarn packages with native code can be built, `node-gyp` depends on it: [details](https://github.com/nodejs/node-gyp?tab=readme-ov-file#on-windows)_
-   Install [git](https://git-scm.com/downloads/win) using the installer and make sure to include git bash for Windows
-   Install nodeJS version as per [.nvmrc](https://github.com/trezor/trezor-suite/blob/develop/.nvmrc)
    -   You may use nvm, but it's not officially supported on Windows; manual nodeJS installation will work
-   Enable [Yarn](https://yarnpkg.com/getting-started/install) through npm
-   Install [Git LFS](https://git-lfs.com/)
-   It is **imperative** that all further commands are run in bash for Windows, **not** in cmd or powershell!
    -   Especially, do not run any `yarn` command in a shell other than bash for Windows. If you have done so, delete `node_modules` and start over.

### Setup

-   Proceed with the [Getting Started instructions in README](https://github.com/trezor/trezor-suite/blob/develop/README.md#getting-started).
    -   _(except possibly the `nvm` step, depending on your choice)_

### Tips

-   Exclude the `trezor-suite` folder from Windows Defender, as it may slow down the build process considerably

## Windows Subsystem for Linux

⚠ Using WSL is a more sandboxed way to run the dev env, but note that it is **not** actively maintained, and not all features may work.

### Setup

On Windows:

-   [Install an Ubuntu WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) _(must be v2, you may upgrade existing v1 WSL to v2)_
-   Install [USBIPD](https://learn.microsoft.com/en-us/windows/wsl/connect-usb)

In WSL:

-   Run `sudo apt-get install build-essential`
-   Install these [Electron dependencies](https://www.electronjs.org/docs/latest/development/build-instructions-linux) for Linux
-   Install udev rules [as per the Trezor docs](https://trezor.io/learn/a/udev-rules)

Then proceed with the [Getting Started instructions in README](https://github.com/trezor/trezor-suite/blob/develop/README.md#getting-started).

#### Connecting USB device

On Windows, run `usbipd list`, find the bus id of the Trezor device, e.g. `2-1`.

Then run:

```
usbipd bind --busid 2-1
usbipd attach --wsl --busid 2-1
```

In WSL, run `lsusb` to confirm the device is visible.

_Note: Without udev rules, the device will be visible by `lsusb`, but not in the app._
