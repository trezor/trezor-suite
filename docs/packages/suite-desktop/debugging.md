# Suite Desktop debugging

## Debugging main process (Chrome dev tools)

[Source](https://www.electronjs.org/docs/latest/tutorial/debugging-main-process)

Open chrome and go to `chrome://inspect`

In "Devices" tab make sure that "Discover network targets" is enabled and "localhost:5858" is added (use Configure button)

## dev mode

modify packages/suite-desktop/package.json

```
"dev:run": "electron ."
// to
"dev:run": "electron --inspect=5858 ."
```

## prod mode

Run production build with `--inspect=5858` runtime flag

## Debugging build

#### Linux

`./Trezor-Suite-22.7.2.AppImage --log-level=debug`

#### MacOS

`./Trezor\ Suite.app/Contents/MacOS/Trezor\ Suite --log-level=debug`

#### NixOS

`appimage-run ./Trezor-Suite.AppImage --log-level=debug`

#### Windows

`"C:\Users\[user-name]\AppData\Local\Programs\Trezor Suite\Trezor Suite.exe" --log-level=debug`
