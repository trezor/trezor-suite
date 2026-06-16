import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { rippleGetAddress } from './rippleGetAddress';
import type { rippleSignTransaction } from './rippleSignTransaction';

// Ripple-specific operations
export const TrezorConnectRipple = Type.Object({
    rippleGetAddress: Type.Unsafe<typeof rippleGetAddress>(),
    rippleSignTransaction: Type.Unsafe<typeof rippleSignTransaction>(),
});
export type TrezorConnectRipple = Static<typeof TrezorConnectRipple>;
