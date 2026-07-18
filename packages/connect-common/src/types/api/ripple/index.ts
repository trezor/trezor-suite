import type { rippleGetAddress } from './rippleGetAddress';
import type { rippleSignTransaction } from './rippleSignTransaction';

// Ripple-specific operations
export interface TrezorConnectRipple {
    rippleGetAddress: typeof rippleGetAddress;
    rippleSignTransaction: typeof rippleSignTransaction;
}
