// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/TransactionComposer.js

import BigNumber from 'bignumber.js';
import { composeTx, ComposeOutput } from '@trezor/utxo-lib';
import { FeeLevels } from './Fees';
import { Blockchain } from '../../backend/BlockchainLink';
import type { BitcoinNetworkInfo, DiscoveryAccount, SelectFeeLevel } from '../../types';
import type {
    ComposeUtxo,
    ComposedInputs,
    ComposeResult,
} from '../../types/api/composeTransaction';

type Options = {
    account: DiscoveryAccount;
    utxos: ComposeUtxo[];
    outputs: ComposeOutput[];
    coinInfo: BitcoinNetworkInfo;
    baseFee?: number;
    skipPermutation?: boolean;
};

export class TransactionComposer {
    account: DiscoveryAccount;

    utxos: ComposedInputs[];

    outputs: ComposeOutput[];

    coinInfo: BitcoinNetworkInfo;

    blockHeight = 0;

    baseFee: number;

    skipPermutation: boolean;

    feeLevels: FeeLevels;

    composed: { [key: string]: ComposeResult } = {};

    constructor(options: Options) {
        this.account = options.account;
        this.outputs = options.outputs;
        this.coinInfo = options.coinInfo;
        this.blockHeight = 0;
        this.baseFee = options.baseFee || 0;
        this.skipPermutation = options.skipPermutation || false;
        this.feeLevels = new FeeLevels(options.coinInfo);

        // map to @trezor/utxo-lib/compose format
        const { addresses } = options.account;
        const allAddresses: string[] = !addresses
            ? []
            : addresses.used
                  .concat(addresses.unused)
                  .concat(addresses.change)
                  .map(a => a.address);
        this.utxos = options.utxos.flatMap(u => {
            // exclude amounts lower than dust limit if they are NOT required
            if (!u.required && new BigNumber(u.amount).lte(this.coinInfo.dustLimit)) return [];

            return {
                ...u,
                coinbase: typeof u.coinbase === 'boolean' ? u.coinbase : false, // decide it it can be spent immediately (false) or after 100 conf (true)
                own: allAddresses.indexOf(u.address) >= 0, // decide if it can be spent immediately (own) or after 6 conf (not own)
            };
        });
    }

    async init(blockchain: Blockchain) {
        const { blockHeight } = await blockchain.getNetworkInfo();
        this.blockHeight = blockHeight;

        await this.feeLevels.load(blockchain);
    }

    // Composing fee levels for SelectFee view in popup
    composeAllFeeLevels() {
        const { levels } = this.feeLevels;
        if (this.utxos.length < 1) return false;

        this.composed = {};
        let atLeastOneValid = false;
        levels.forEach(level => {
            if (level.feePerUnit !== '0') {
                const tx = this.compose(level.feePerUnit);
                if (tx.type === 'final') {
                    atLeastOneValid = true;
                }
                this.composed[level.label] = tx;
            }
        });

        if (!atLeastOneValid) {
            const lastLevel = levels[levels.length - 1];
            let lastFee = new BigNumber(lastLevel.feePerUnit);
            while (lastFee.gt(this.coinInfo.minFee) && this.composed.custom === undefined) {
                lastFee = lastFee.minus(1);

                const tx = this.compose(lastFee.toString());
                if (tx.type === 'final') {
                    this.feeLevels.updateCustomFee(lastFee.toString());
                    this.composed.custom = tx;
                    return true;
                }
            }

            return false;
        }

        return true;
    }

    composeCustomFee(fee: string) {
        const tx = this.compose(fee);
        this.composed.custom = tx;
        if (tx.type === 'final') {
            this.feeLevels.updateCustomFee(tx.feePerByte);
        } else {
            this.feeLevels.updateCustomFee(fee);
        }
    }

    getFeeLevelList() {
        const list: SelectFeeLevel[] = [];
        const { levels } = this.feeLevels;
        levels.forEach(level => {
            const tx = this.composed[level.label];
            if (tx && tx.type === 'final') {
                list.push({
                    name: level.label,
                    fee: tx.fee,
                    feePerByte: level.feePerUnit,
                    minutes: level.blocks * this.coinInfo.blockTime,
                    total: tx.totalSpent,
                });
            } else {
                list.push({
                    name: level.label,
                    fee: '0',
                    disabled: true,
                });
            }
        });
        return list;
    }

    compose(feeRate: string): ComposeResult {
        const { account, coinInfo, baseFee } = this;
        const { addresses } = account;
        if (!addresses) return { type: 'error', error: 'ADDRESSES-NOT-SET' };
        // find not used change address or fallback to the last in the list
        const changeAddress =
            addresses.change.find(a => !a.transfers) ||
            addresses.change[addresses.change.length - 1];
        // const inputAmounts = coinInfo.segwit || coinInfo.forkid !== null || coinInfo.network.consensusBranchId !== null;

        return composeTx({
            txType: account.type,
            utxos: this.utxos,
            outputs: this.outputs,
            feeRate,
            longTermFeeRate: this.feeLevels.longTermFeeRate,
            skipPermutation: this.skipPermutation,
            network: coinInfo.network,
            changeAddress,
            dustThreshold: coinInfo.dustLimit,
            baseFee,
        });
    }

    dispose() {
        // TODO
    }
}
