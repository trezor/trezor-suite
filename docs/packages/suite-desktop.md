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

## DevTools
DevTools are automatically opened on dev builds and can also be used on production builds. For production builds, you need to run Suite Desktop with the `--disable-csp` flag and press CTRL+SHIFT+I, or CMD+SHIFT+I on Mac, to open the DevTools.

For development builds only, additional extensions are loaded, such as Redux DevTools. This is controlled by the `package.json` file inside the `@trezor/suite-desktop` package under the `extensions` property. This property is an array of extension IDs. Adding a new ID will result in the extension being downloaded and extracted using `yarn run build:ext` (which is also run together with `yarn run dev`). Once running, Electron will be loading all extensions specified in the `package.json` file.
