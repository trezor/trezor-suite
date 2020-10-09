# Suite Desktop

## Shortcuts
_TODO_

## Runtime flags
Runtime flags can be used when running the Suite Desktop executable, enabling or disabling certain features. For example: `./Trezor-Suite-20.10.1.AppImage --disable-csp` will run with this flag turned on, which will result in the Content Security Policy being disabled. 

Available flags:
| name | description |
| --- | --- |
| `--disable-csp` | Disables the Content Security Policy. Necessary for using DevTools in a production build. |
| `--pre-release` | Tells the auto-updater to fetch pre-release updates. |
