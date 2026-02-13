import './testSetup';

export { BasicProviderForTests } from './BasicProviderForTests';
export { StoreProviderForTests, type TestStore } from './StoreProviderForTests';
export { renderWithBasicProvider, renderHookWithBasicProvider } from './renderBasic';
export { renderWithStoreProvider, renderHookWithStoreProvider } from './renderWithStore';
export { initStoreForTests } from './initStoreForTests';

// Re-export commonly used testing utilities
export * from '@testing-library/react';
export * from '@testing-library/user-event';

// Re-export store types from @trezor/suite
export type { PreloadedState } from '@trezor/suite';
