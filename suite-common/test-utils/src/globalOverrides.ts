// in-memory implementation of indexedDB as a replacement in node environment
import 'fake-indexeddb/auto';

// fake-indexeddb requires this polyfill with jsdom environment
// https://github.com/dumbmatter/fakeIndexedDB/blob/57465fd/README.md#jsdom-often-used-with-jest
import 'core-js/stable/structured-clone';
