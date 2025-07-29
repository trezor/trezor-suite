# Trezor Suite Desktop Native

This package contains native modules for Trezor Suite desktop application, specifically the Windows Hello authentication module.

## Overview

The `@trezor/suite-desktop-native` package provides native functionality for the Trezor Suite desktop application. Currently, it includes:

- Windows Hello authentication integration (`win_hello.node`)

### Windows Hello Implementation

The Windows Hello module uses the `UserConsentVerifier` API to implement biometric authentication in Trezor Suite. This approach bypasses the AppX identity requirement, allowing us to ship the biometrics feature on Windows without needing to publish the application through the Microsoft Store. This gives users access to Windows Hello authentication in the standard desktop distribution.

## Build Requirements

### Windows Hello Module

The Windows Hello module can **only be built on Windows** and requires:

- Windows 10 or later
- Visual Studio 2022 Community Edition or higher
- Windows 10 SDK (included with Visual Studio)
- Node.js development tools

## Build Instructions

### Prerequisites

1. Install [Visual Studio 2022 Community Edition](https://visualstudio.microsoft.com/vs/community/)
    - During installation, make sure to select the "Desktop development with C++" workload
    - Ensure the "Windows 10 SDK" component is selected

2. Make sure you have Node.js and Yarn installed

### Building the Windows Hello Module

1. Run the build command:

    ```
    yarn workspace @trezor/suite-desktop-native build:native
    ```

This will:

- Compile the C++ code using node-gyp
- Generate the `win_hello.node` binary in the `build/Release` directory
- Copy the binary to the `src` directory for use in the application

**Note:** The build script will automatically fail if run on non-Windows platforms.

## Source Code

The Windows Hello module source code is located in:

- `binding.gyp` - Build configuration
- `src/win_hello.cpp` - C++ implementation of Windows Hello integration
- `src/win_hello.d.ts` - TypeScript type definitions

## Rebuilding After Changes

If you make changes to the C++ source code (`win_hello.cpp`), you must rebuild the module:

1. Clean the build artifacts:

    ```
    yarn clean
    ```

2. Rebuild the module:
    ```
    yarn build:native
    ```

## Integration with Trezor Suite

The Windows Hello module is automatically packaged with the Windows build of Trezor Suite. The electron-builder configuration in `packages/suite-desktop/electron-builder-config.js` includes this package in the final application bundle.

### Packaging and Loading the Native Module

Electron-builder uses the `extraResources` configuration to copy the native module to the `app.asar.unpacked/@trezor/suite-desktop-native` directory in the packaged application. This approach is used because native modules cannot be packed inside the `app.asar` archive.

```javascript
// From electron-builder-config.js
extraResources: [
    {
        from: '../suite-desktop-native/',
        to: 'app.asar.unpacked/@trezor/suite-desktop-native',
    },
],
```

In the `index.ts` file, we use `process.dlopen()` instead of the standard `require()` to load the native binary. This approach was necessary because `require()` could not reliably load the binary in the Electron environment, likely due to Electron's module resolution limitations when dealing with native modules in packaged applications.

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Make sure you're running on Windows
2. Verify Visual Studio 2022 is installed with the correct components
3. Try running with verbose output:
    ```
    yarn build:native --verbose
    ```

### Runtime Errors

If the module fails to load at runtime:

1. Check that the `win_hello.node` file exists in the correct location
2. Verify Windows Hello is available and enabled on your system
3. Check application logs for detailed error messages
