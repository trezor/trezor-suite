import { TextDecoder, TextEncoder } from 'node:util';

// TextEncoder/TextDecoder polyfill for jsdom environment in Jest, which doesn't provide them, even though they are part of both Node and Web APIs
// See https://github.com/jsdom/jsdom/issues/2524

global.TextEncoder = TextEncoder;
// @ts-expect-error slight type incompatibility between DOM and node:utils, but for test polyfill it works
global.TextDecoder = TextDecoder;
