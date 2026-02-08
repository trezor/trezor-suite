# Suite Desktop anonymous mode

Suite Web can be run in an anonymous browser window, guaranteeing fresh data on start, and no persisted data after it is closed.

While Suite Desktop has no such native feature, it is possible to do by wrapping it in a simple shell script.
Those are listed below for each platform.

#### ⚠️ Warning

- **This will delete your existing data!**
    - there is no separation of normal session and anonymous session, like there is in a browser
- Already paired bluetooth devices may need to be paired again
- **Use at your own risk**

## Windows

Note: the script autodetects "system" vs. "user" installation.

Create `Suite-anonymous.bat` anywhere:

```cmd
@echo off
echo Launching trezor suite \"anonymously\"
set "APP_PF=C:\Program Files\Trezor Suite\Trezor Suite.exe"
set "APP_USER=C:\Users\%USERNAME%\AppData\Local\Programs\Trezor Suite\Trezor Suite.exe"
set "DATA_DIR=C:\Users\%USERNAME%\AppData\Roaming\@trezor\suite-desktop"
if exist "%APP_PF%" (
    start "" /wait "%APP_PF%"
) else if exist "%APP_USER%" (
    start "" /wait "%APP_USER%"
) else (
    echo Trezor Suite executable not found.
    pause
    exit /b 1
)
rmdir /s /q "%DATA_DIR%"
echo "Purged all Trezor Suite data ;)"
pause
```

## macOS

Create `Suite-anonymous.sh` anywhere, then `chmod +x "./Suite-anonymous.sh"`:

```bash
#!/bin/sh
echo Launching trezor suite \"anonymously\"
open "/Applications/Trezor Suite.app"
rm -rf "$HOME/Library/Application Support/@trezor/suite-desktop"
echo "Purged all Trezor Suite data ;)"
```

## Linux AppImage

Note that you have to **set your own path** in `APPIMAGE_PATH`, because AppImage has no "install directory", users can run it from anywhere.

Create `Suite-anonymous.sh` anywhere, then `chmod +x "./Suite-anonymous.sh"`:

```bash
#!/bin/sh
echo Launching trezor suite \"anonymously\"
APPIMAGE_PATH="$HOME/apps/Trezor-Suite.AppImage"
if [ -x "$APPIMAGE_PATH" ]; then
    "$APPIMAGE_PATH" --no-sandbox
else
    echo "Trezor Suite AppImage not found."
    exit 1
fi
rm -rf $HOME/.config/@trezor/suite-desktop
echo "Purged all Trezor Suite data ;)"
```

The `--no-sandbox` parameter is necessary on Ubuntu 24+, may not be needed on other distros.

## Notes

Note that the local config is located at `@trezor/suite-desktop` only if you downloaded [the official Trezor Suite](https://trezor.io/trezor-suite).

If you have self-built your app instead, then it shall be `@trezor/suite-desktop-dev`, see [details here](./index.md#app-id-and-name-by-environment)
