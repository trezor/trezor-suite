// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/TransactionComposer.js

import type {
    AccountAddresses,
    BitcoinNetworkInfo,
    ComposeResult,
    ComposeUtxo,
    DiscoveryAccountType,
} from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import type {
    ComposeFeePolicy,
    ComposeOutput,
    TransactionInputOutputSortingStrategy,
} from '@trezor/utxo-lib';
import { composeTx, networks } from '@trezor/utxo-lib';

import { DEFAULT_BITCOIN_LONGTERM_FEE_RATE } from '../../data/defaultFeeLevels';

type Options = {
    txType: DiscoveryAccountType;
    addresses?: AccountAddresses;
    utxos: ComposeUtxo[];
    outputs: ComposeOutput[];
    coinInfo: BitcoinNetworkInfo;
    baseFee?: number;
    sortingStrategy: TransactionInputOutputSortingStrategy;
};

export const createComposer = (options: Options) => {
    const { txType, addresses, outputs, coinInfo, baseFee = 0, sortingStrategy, utxos } = options;

    const allAddresses = new Set(
        addresses?.used
            .concat(addresses.unused)
            .concat(addresses.change)
            .map(a => a.address),
    );

    // find unused change address or fallback to the last in the list
    const changeAddress = addresses?.change.find(a => !a.transfers) ?? addresses?.change.at(-1);

    // map to @trezor/utxo-lib/compose format
    const utxosFiltered = utxos
        // exclude amounts lower than dust limit if they are NOT required
        .filter(u => u.required || new BigNumber(u.amount).gt(coinInfo.dustLimit))
        .map(u => ({
            ...u,
            coinbase: typeof u.coinbase === 'boolean' ? u.coinbase : false, // decide it it can be spent immediately (false) or after 100 conf (true)
            own: allAddresses.has(u.address), // decide if it can be spent immediately (own) or after 6 conf (not own)
        }));

    let feePolicy: ComposeFeePolicy | undefined;
    if (networks.isNetworkType('doge', coinInfo.network)) {
        feePolicy = 'doge';
    } else if (networks.isNetworkType('zcash', coinInfo.network)) {
        feePolicy = 'zcash';
    }

    return (feeRate: string): ComposeResult => {
        if (!utxosFiltered.length) return { type: 'error', error: 'MISSING-UTXOS' };
        if (!changeAddress) return { type: 'error', error: 'ADDRESSES-NOT-SET' };

        return composeTx({
            txType,
            utxos: utxosFiltered,
            outputs,
            feeRate,
            // TODO https://github.com/trezor/trezor-suite/issues/18483 rewrite with response from a new planned blockbook API
            longTermFeeRate: DEFAULT_BITCOIN_LONGTERM_FEE_RATE,
            sortingStrategy,
            network: coinInfo.network,
            changeAddress,
            dustThreshold: coinInfo.dustLimit,
            baseFee,
            feePolicy,
        });
    };
};
