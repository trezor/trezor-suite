# weird stuff, notes and issues

- [Android emulator no internet](https://stackoverflow.com/questions/42736038/android-emulator-not-able-to-access-the-internet)

- [Typing connected component using redux-thunk action creators](https://github.com/piotrwitek/react-redux-typescript-guide#typing-connected-component-using-redux-thunk-action-creators)

- [Notes on React Native setup inside a monorepo](./packages/componentsStorybookNative/README.md)

- [Tests for custom hooks in suite are ignored (modulePathIgnorePatterns: '<rootDir>/src/utils/suite/hooks')](./packages/suite/jest.config.js)

## things to do in future

### Bridge in electron
- package.json > "build": { "asar": false } required
- Include bridge library in desktop only for a specific environment to reduce the size of a bundle.
- How to get bridge version?
- Test windows

### Debugging Electron build

- Mac: Run /path/to/app/TrezorSuite.app/Contents/MacOS/TrezorSuite --debug
- Decompile: npx asar extract packages/suite-desktop/build-electron/mac/TrezorSuite.app/Contents/Resources/app.asar ./decompiled