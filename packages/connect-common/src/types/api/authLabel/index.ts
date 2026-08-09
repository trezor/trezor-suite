import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { authLabelBindAddress } from './authLabelBindAddress';
import type { authLabelChange } from './authLabelChange';
import type { authLabelGetState } from './authLabelGetState';
import type { authLabelShow } from './authLabelShow';

// Authenticated labeling (proof of concept) operations
export const TrezorConnectAuthLabel = Type.Object({
    authLabelGetState: Type.Unsafe<typeof authLabelGetState>(),
    authLabelShow: Type.Unsafe<typeof authLabelShow>(),
    authLabelChange: Type.Unsafe<typeof authLabelChange>(),
    authLabelBindAddress: Type.Unsafe<typeof authLabelBindAddress>(),
});
export type TrezorConnectAuthLabel = Static<typeof TrezorConnectAuthLabel>;
