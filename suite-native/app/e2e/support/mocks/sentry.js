'use strict';

// The Jest worker process doesn't need a real Sentry SDK — the actual SDK runs
// inside the React Native app on the device. This stub prevents @sentry/react-native
// from creating its module-level setInterval (AsyncExpiringMap) which would keep
// Jest from exiting after the test run.
const noop = () => {};

const sentryMock = new Proxy(
    { __esModule: true },
    { get: (target, prop) => (prop in target ? target[prop] : noop) },
);

module.exports = sentryMock;
