// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/TransactionComposer.js

import type { Address } from '@trezor/blockchain-link-types';
import type {
    BitcoinNetworkInfo,
    ComposeResult,
    ComposeUtxo,
    ComposedInputs,
    DiscoveryAccount,
    FeeLevel,
    SelectFeeLevel,
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
    private customFee: string | undefined;
    private feePolicy: ComposeFeePolicy | undefined;
    private changeAddress: Address | undefined;

    composed: { [key: string]: ComposeResult } = {};

    private get levels() {
        return this.customFee
            ? this.feeLevels.concat([
                  { label: 'custom' as const, feePerUnit: this.customFee, blocks: -1 },
              ])
            : this.feeLevels;
    }

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
        const { levels } = this;

        if (!this.utxos.length) {
            return false;
        }

        this.composed = Object.fromEntries(
            levels
                .filter(({ feePerUnit }) => feePerUnit !== '0')
                .map(({ label, feePerUnit }) => [label, this.compose(feePerUnit)]),
        );

        const atLeastOneValid = Object.values(this.composed).some(tx => tx.type === 'final');
        if (atLeastOneValid) {
            return true;
        }

        if (this.composed.custom) {
            return false;
        }

        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const lastLevel: (typeof levels)[number] = levels[levels.length - 1];
        let lastFee = new BigNumber(lastLevel.feePerUnit);
        while (lastFee.gt(this.coinInfo.minFee)) {
            lastFee = lastFee.minus(1);

            const tx = this.compose(lastFee.toString());
            if (tx.type === 'final') {
                this.customFee = lastFee.toString();
                this.composed.custom = tx;

                return true;
            }
        }

        return false;
    }

    composeCustomFee(fee: string) {
        const tx = this.compose(fee);
        this.composed.custom = tx;
        this.customFee = tx.type === 'final' ? tx.feePerByte : fee;
    }

    getFeeLevelList(): SelectFeeLevel[] {
        return this.levels.map(level => {
            const tx = this.composed[level.label];
            if (tx?.type === 'final') {
                return {
                    name: level.label,
                    fee: tx.fee,
                    feePerByte: level.feePerUnit,
                    blocks: level.blocks,
                    minutes: level.blocks * this.coinInfo.blockTime,
                    total: tx.totalSpent,
                };
            } else {
                return {
                    name: level.label,
                    fee: '0',
                    disabled: true,
                };
            }
        });
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
