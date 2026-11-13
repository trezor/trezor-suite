import type { pushTransaction } from './pushTransaction';

// Served by Trezor Suite's backends, see @trezor/blockchain-core.
export type TrezorConnectBlockchain = {
    pushTransaction: typeof pushTransaction;
};
