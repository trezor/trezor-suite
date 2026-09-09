import type { MockStorage } from './mockSymbolTags';

export type { MockStorage as MockReexportedStorage };

export type { MockResolveNamedAddress, MockStorage, MockUnmarkedService } from './mockSymbolTags';

export {
    MockTaggedClass,
    mockTaggedFunction as mockLegacyFunction,
    mockTaggedValue,
} from './mockSymbolTags';
