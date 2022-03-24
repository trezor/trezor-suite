// Type definitions for trezor-connect 8.0
// Project: https://github.com/trezor/connect
// Definitions by: Federico Bond <https://github.com/federicobond>, Szymon Lesisz <https://github.com/szymonlesisz>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.5

/// <reference types="node" />

import { TrezorConnect } from './api';

export * from './events';
export * from './misc';
export * from './params';
export * from './constants';

export * from './account';
export * from './trezor/device';
export * from './trezor/management';

export * from './networks/bitcoin';
export * from './networks/binance';
export * from './networks/cardano';
export * from './networks/coinInfo';
export * from './networks/eos';
export * from './networks/ethereum';
export * from './networks/nem';
export * from './networks/ripple';
export * from './networks/stellar';
export * from './networks/tezos';

export * from './backend/blockchain';
export * from './backend/transactions';

export default TrezorConnect;
