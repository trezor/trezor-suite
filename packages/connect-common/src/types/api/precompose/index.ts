import type { ethereumPrecomposeSignTransaction } from './ethereumPrecomposeSignTransaction';
import type { precomposeSignTransaction } from './precomposeSignTransaction';
import type { solanaPrecomposeSignTransaction } from './solanaPrecomposeSignTransaction';

// Summaries of a signing call for Suite's transaction review, computed without the device
export type TrezorConnectPrecompose = {
    precomposeSignTransaction: typeof precomposeSignTransaction;
    ethereumPrecomposeSignTransaction: typeof ethereumPrecomposeSignTransaction;
    solanaPrecomposeSignTransaction: typeof solanaPrecomposeSignTransaction;
};
