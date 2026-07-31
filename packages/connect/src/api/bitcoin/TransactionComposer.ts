// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/TransactionComposer.js

import type { Address } from '@trezor/blockchain-link-types';
import type {
    BitcoinNetworkInfo,
    ComposeResult,
    ComposeUtxo,
    ComposedInputs,
    DiscoveryAccount,
    FeeLevel,
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
    account: DiscoveryAccount;
    utxos: ComposeUtxo[];
    outputs: ComposeOutput[];
    coinInfo: BitcoinNetworkInfo;
    baseFee?: number;
    feeLevels: FeeLevel[];
    sortingStrategy: TransactionInputOutputSortingStrategy;
};

export class TransactionComposer {
    private account: DiscoveryAccount;
    private utxos: ComposedInputs[];
    private outputs: ComposeOutput[];
    private coinInfo: BitcoinNetworkInfo;
    private baseFee: number;
    private sortingStrategy: TransactionInputOutputSortingStrategy;
    private feeLevels: FeeLevel[];
    private feePolicy: ComposeFeePolicy | undefined;
    private changeAddress: Address | undefined;

    composed: { [key: string]: ComposeResult } = {};

    constructor(options: Options) {
        this.account = options.account;
        this.outputs = options.outputs;
        this.coinInfo = options.coinInfo;
        this.baseFee = options.baseFee || 0;
        this.sortingStrategy = options.sortingStrategy;
        this.feeLevels = options.feeLevels;

        const { addresses } = options.account;
        const allAddresses = new Set(
            addresses?.used
                .concat(addresses.unused)
                .concat(addresses.change)
                .map(a => a.address),
        );

        // find unused change address or fallback to the last in the list
        this.changeAddress = addresses?.change.find(a => !a.transfers) ?? addresses?.change.at(-1);

        // map to @trezor/utxo-lib/compose format
        this.utxos = options.utxos
            // exclude amounts lower than dust limit if they are NOT required
            .filter(u => u.required || new BigNumber(u.amount).gt(this.coinInfo.dustLimit))
            .map(u => ({
                ...u,
                coinbase: typeof u.coinbase === 'boolean' ? u.coinbase : false, // decide it it can be spent immediately (false) or after 100 conf (true)
                own: allAddresses.has(u.address), // decide if it can be spent immediately (own) or after 6 conf (not own)
            }));

        if (networks.isNetworkType('doge', options.coinInfo.network)) {
            this.feePolicy = 'doge';
        } else if (networks.isNetworkType('zcash', options.coinInfo.network)) {
            this.feePolicy = 'zcash';
        }
    }

    // Composing fee levels for SelectFee view in popup
    composeAllFeeLevels() {
        if (!this.utxos.length) {
            return false;
        }

        this.composed = Object.fromEntries(
            this.feeLevels
                .filter(({ feePerUnit }) => feePerUnit !== '0')
                .map(({ label, feePerUnit }) => [label, this.compose(feePerUnit)]),
        );

        const atLeastOneValid = Object.values(this.composed).some(tx => tx.type === 'final');

        return atLeastOneValid;
    }

    composeCustomFee(fee: string) {
        return this.compose(fee);
    }

    getFeeLevelList(): FeeLevel[] {
        return this.feeLevels.filter(level => this.composed[level.label]?.type === 'final');
    }

    private compose(feeRate: string): ComposeResult {
        const { account, coinInfo, baseFee, changeAddress, feePolicy } = this;

        if (!changeAddress) return { type: 'error', error: 'ADDRESSES-NOT-SET' };

        return composeTx({
            txType: account.type,
            utxos: this.utxos,
            outputs: this.outputs,
            feeRate,
            // TODO https://github.com/trezor/trezor-suite/issues/18483 rewrite with response from a new planned blockbook API
            longTermFeeRate: DEFAULT_BITCOIN_LONGTERM_FEE_RATE,
            sortingStrategy: this.sortingStrategy,
            network: coinInfo.network,
            changeAddress,
            dustThreshold: coinInfo.dustLimit,
            baseFee,
            feePolicy,
        });
    }
}
