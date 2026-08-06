export * from './mocks';
export * from './configureMockStore';
export * from './wireEnabledNetworksMock';
export { renderHookWithStoreProvider, type TestStore } from './renderWithStore';

// TODO: This dependency on the global ExtraDependencies type is bad, temporary, terrible, and
// disastrous. Remove it in follow-ups tracked by https://github.com/trezor/trezor-suite/issues/30770.
export { extraDependenciesCommonMock } from '@suite-common/redux-extra-dependencies/mocks';
export * from '@testing-library/react';
