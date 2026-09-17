// Usage:
// **make sure that mock files are listed in project jest.config file**
// roots: ['<rootDir>/src', '<rootDir>/../test-utils/__mocks__']
// `'@trezor/connect` module will be automatically mocked in all tests
// https://jestjs.io/docs/manual-mocks#mocking-node-modules

import { createMockTrezorConnect } from '../../src/createMockTrezorConnect';

const connect = jest.requireActual('@trezor/connect');

// One shared instance backs the auto-mocked default export and the module-level test helpers, so tests
// reaching for the singleton (getTrezorConnectMock / setTestFixtures / emitTestEvent) keep working.
// Tests that want isolation inject their own createMockTrezorConnect() through DI instead.
const defaultMock = createMockTrezorConnect();

module.exports = {
    __esModule: true,
    ...connect,
    default: defaultMock,
    setTestFixtures: defaultMock.setTestFixtures,
    emitTestEvent: defaultMock.emitTestEvent,
};
