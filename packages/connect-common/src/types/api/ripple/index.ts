import type { rippleGetAddress } from './rippleGetAddress';
import type { rippleSignTransaction } from './rippleSignTransaction';

// Ripple-specific operations
export type TrezorConnectRipple = {
    rippleGetAddress: typeof rippleGetAddress;
    rippleSignTransaction: typeof rippleSignTransaction;
};
