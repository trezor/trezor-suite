// Global test environment setup for Suite tests
// This file provides necessary polyfills and mocks for the test environment

// In-memory implementation of indexedDB as a replacement in Node environment
// and other global polyfills (setImmediate, structured-clone, etc.)
// eslint-disable-next-line local-rules/no-package-deep-imports
import '@suite-common/test-utils/src/globalOverrides';

// Mock @suite-common/tx-simulation to prevent Blockaid client initialization
// which requires Web Fetch API types not available in Node test environment
jest.mock('@suite-common/tx-simulation', () => ({}));
