// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ComposeTransaction.js

import {
    type BitcoinNetworkInfo,
    DEFAULT_SORTING_STRATEGY,
    ERRORS,
    type PermissionRequest,
    type PrecomposeParams,
    type PrecomposedResult,
} from '@trezor/connect-common';
import type { ComposeOutput } from '@trezor/utxo-lib';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getBitcoinNetwork } from '../data/coinInfo';
import * as pathUtils from '../utils/pathUtils';
import { createComposer } from './bitcoin/TransactionComposer';
import { inputToTrezor } from './bitcoin/inputs';
import { outputToTrezor, validateHDOutput } from './bitcoin/outputs';
import { validateParams } from './common/paramsValidator';

type Params = Omit<PrecomposeParams, 'coin' | 'outputs'> & {
    outputs: ComposeOutput[];
    coinInfo: BitcoinNetworkInfo;
};

export default class ComposeTransaction extends AbstractMethod<'composeTransaction', Params> {
    constructor(message: MethodMessage<'composeTransaction'>) {
        const { payload } = message;
        // validate incoming parameters
        validateParams(payload, [
            { name: 'outputs', type: 'array', required: true },
            { name: 'coin', type: 'string', required: true },
            { name: 'account', type: 'object', required: true },
            { name: 'feeLevels', type: 'array', required: true },
            { name: 'baseFee', type: 'number' },
            { name: 'sequence', type: 'number' },
            { name: 'sortingStrategy', type: 'string' },
        ]);

        const coinInfo = getBitcoinNetwork(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }

        // validate each output and transform into @trezor/utxo-lib/compose format
        const outputs = payload.outputs.map(out => validateHDOutput(out, coinInfo));

        const params = {
            outputs,
            coinInfo,
            account: payload.account,
            feeLevels: payload.feeLevels,
            baseFee: payload.baseFee,
            sequence: payload.sequence,
            sortingStrategy: payload.sortingStrategy,
        };

        super(message, params);

        this.useDevice = false;
        this.useUi = false;
        this.requiredFirmwareCoins = [coinInfo];
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    get info() {
        return `Compose transaction`;
    }

    run(): Promise<PrecomposedResult[]> {
        const { coinInfo, outputs, baseFee, sortingStrategy, account, feeLevels } = this.params;
        const address_n = pathUtils.validatePath(account.path);

        const compose = createComposer({
            txType: pathUtils.getAccountType(address_n),
            addresses: account.addresses,
            utxos: account.utxo,
            coinInfo,
            outputs,
            baseFee,
            sortingStrategy: sortingStrategy ?? DEFAULT_SORTING_STRATEGY,
        });

        const levels = feeLevels.map(level => {
            const tx = compose(level.feePerUnit);
            if (tx.type === 'final') {
                return {
                    ...tx,
                    inputs: tx.inputs.map(inp => inputToTrezor(inp, this.params.sequence)),
                    outputs: tx.outputs.map(outputToTrezor),
                };
            }
            if (tx.type === 'nonfinal') {
                return {
                    ...tx,
                    inputs: tx.inputs.map(inp => inputToTrezor(inp, this.params.sequence)),
                };
            }

            return tx;
        });

        return Promise.resolve(levels);
    }
}
