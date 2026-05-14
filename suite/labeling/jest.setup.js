const { TextEncoder, TextDecoder } = require('util');

Object.assign(global, { TextDecoder, TextEncoder });

// Todo: once we are on ESM this should not be needed + the WASM import will needs to be solved in jest
jest.mock('@evolu/web', () => ({ evoluWebDeps: {} }));
