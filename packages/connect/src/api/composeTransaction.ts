// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ComposeTransaction.js

import { ERRORS } from '@trezor/connect-common/src/constants';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import type { ComposeOutput, TransactionInputOutputSortingStrategy } from '@trezor/utxo-lib';

import { TransactionComposer, inputToTrezor, outputToTrezor, validateHDOutput } from './bitcoin';
import { initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import { DEFAULT_SORTING_STRATEGY } from '../constants/utxo';
import { AbstractMethod, MethodPermission } from '../core/AbstractMethod';
import type { BitcoinNetworkInfo } from '../types';
import { getFirmwareRange, validateParams } from './common/paramsValidator';
import { getBitcoinNetwork } from '../data/coinInfo';
import type { PrecomposeParams, PrecomposedResult } from '../types/api/composeTransaction';
import { formatAmount } from '../utils/formatUtils';
import * as pathUtils from '../utils/pathUtils';

type Params = {
    outputs: ComposeOutput[];
    coinInfo: BitcoinNetworkInfo;
    identity?: string;
    account: PrecomposeParams['account'];
    feeLevels: PrecomposeParams['feeLevels'];
    baseFee?: PrecomposeParams['baseFee'];
    floorBaseFee?: PrecomposeParams['floorBaseFee'];
    sequence?: PrecomposeParams['sequence'];
    total: BigNumber;
    sortingStrategy: PrecomposeParams['sortingStrategy'];
} & (
    | {
          /** @deprecated: use sortingStrategy=none instead */
          skipPermutation?: PrecomposeParams['skipPermutation'];
          sortingStrategy?: undefined;
      }
    | {
          /** @deprecated: use sortingStrategy=none instead */
          skipPermutation?: undefined;
          sortingStrategy?: TransactionInputOutputSortingStrategy;
      }
);

export default class ComposeTransaction extends AbstractMethod<'composeTransaction', Params> {
    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    init() {
        const { payload } = this;
        // validate incoming parameters
        validateParams(payload, [
            { name: 'outputs', type: 'array', required: true },
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
            { name: 'account', type: 'object', required: true },
            { name: 'feeLevels', type: 'array', required: true },
            { name: 'baseFee', type: 'number' },
            { name: 'floorBaseFee', type: 'boolean' },
            { name: 'sequence', type: 'number' },
            { name: 'skipPermutation', type: 'boolean' },
            { name: 'sortingStrategy', type: 'string' },
        ]);

        const coinInfo = getBitcoinNetwork(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // validate backend
        isBackendSupported(coinInfo);

        // set required firmware from coinInfo support
        this.firmwareRange = getFirmwareRange(this.name, coinInfo, this.firmwareRange);

        // validate each output and transform into @trezor/utxo-lib/compose format
        const outputs: ComposeOutput[] = [];
        let total = new BigNumber(0);
        payload.outputs.forEach(out => {
            const output = validateHDOutput(out, coinInfo);
            if ('amount' in output && typeof output.amount === 'string') {
                total = total.plus(output.amount);
            }
            outputs.push(output);
        });

        this.useDevice = false;
        this.useUi = false;

        this.params = {
            outputs,
            coinInfo,
            identity: payload.identity,
            account: payload.account,
            feeLevels: payload.feeLevels,
            baseFee: payload.baseFee,
            floorBaseFee: payload.floorBaseFee,
            sequence: payload.sequence,
            sortingStrategy: payload.skipPermutation === true ? 'none' : payload.sortingStrategy,
            total,
        };
    }

    get info() {
        const sendMax = this.params?.outputs.find(o => o.type === 'send-max') !== undefined;

        if (sendMax) {
            return 'Send maximum amount';
        }

        return `Send ${formatAmount(this.params.total.toString(), this.params.coinInfo)}`;
    }

    private getBlockchain() {
        return initBlockchain(this.params.coinInfo, this.postMessage, this.params.identity);
    }

    async precompose(
        account: PrecomposeParams['account'],
        feeLevels: PrecomposeParams['feeLevels'],
    ): Promise<PrecomposedResult[]> {
        const { coinInfo, outputs, baseFee, sortingStrategy } = this.params;
        const address_n = pathUtils.validatePath(account.path);
        const composer = new TransactionComposer({
            account: {
                type: pathUtils.getAccountType(address_n),
                label: 'Account',
                descriptor: account.path,
                address_n,
                addresses: account.addresses,
            },
            utxos: account.utxo,
            coinInfo,
            outputs,
            baseFee,
            sortingStrategy: sortingStrategy ?? DEFAULT_SORTING_STRATEGY,
        });

        // This is mandatory, @trezor/utxo-lib/compose expects current block height
        // TODO: make it possible without it (offline composing)
        const blockchain = await this.getBlockchain();
        await composer.init(blockchain);

        return feeLevels.map(level => {
            composer.composeCustomFee(level.feePerUnit);
            const tx = { ...composer.composed.custom }; // needs to spread otherwise flow has a problem with ComposeResult vs PrecomposedTransaction (max could be undefined)
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
    }

    async run(): Promise<PrecomposedResult[]> {
        return await this.precompose(this.params.account, this.params.feeLevels);
    }
}
