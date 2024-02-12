import BigNumber from 'bignumber.js';
import {
    getNetworkFeatures,
    getNetworkType,
    networks,
    NetworkSymbol,
} from '@suite-common/wallet-config';

export const MIN_ETH_AMOUNT_FOR_STAKING = new BigNumber(0.1);
export const MIN_ETH_FOR_WITHDRAWALS = new BigNumber(0.03);
export const MIN_ETH_BALANCE_FOR_STAKING = MIN_ETH_AMOUNT_FOR_STAKING.plus(MIN_ETH_FOR_WITHDRAWALS);

// source is a required parameter for some functions in the Everstake Wallet SDK.
// This parameter is used for some contract calls.
// It is a constant which allows the SDK to define which app calls its functions.
// Each app which integrates the SDK has its own source, e.g. source for Trezor Suite is '1'.
export const WALLET_SDK_SOURCE = '1';

// Used when Everstake pool stats are not available from the API.
export const BACKUP_ETH_APY = '4.13';

export const STAKE_SYMBOLS: NetworkSymbol[] = (Object.keys(networks) as NetworkSymbol[]).filter(
    symbol => {
        const networkType = getNetworkType(symbol);
        const networkFeatures = getNetworkFeatures(symbol);

        if (networkType === 'ethereum' && networkFeatures.includes('staking')) {
            return symbol;
        }
    },
);
