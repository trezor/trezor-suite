// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ComposeTransaction.js

import BigNumber from 'bignumber.js';
import { AbstractMethod } from '../core/AbstractMethod';
import { ERRORS } from '../constants';
import { UI, createUiMessage } from '../events';
import { Discovery } from './common/Discovery';
import { validateParams, getFirmwareRange } from './common/paramsValidator';
import * as pathUtils from '../utils/pathUtils';
import { resolveAfter } from '../utils/promiseUtils';
import { formatAmount } from '../utils/formatUtils';
import { getBitcoinNetwork, fixCoinInfoNetwork } from '../data/coinInfo';
import { isBackendSupported, initBlockchain } from '../backend/BlockchainLink';
import {
    TransactionComposer,
    requireReferencedTransactions,
    getReferencedTransactions,
    transformReferencedTransactions,
    inputToTrezor,
    validateHDOutput,
    outputToTrezor,
    enhanceSignTx,
    signTx,
    signTxLegacy,
    verifyTx,
} from './bitcoin';
import type { ComposeOutput } from '@trezor/utxo-lib';
import type { BitcoinNetworkInfo, DiscoveryAccount, AccountUtxo } from '../types';
import type {
    SignedTransaction,
    PrecomposeParams,
    ComposeResult,
    PrecomposedResult,
} from '../types/api/composeTransaction';
import type { RefTransaction } from '../types/api/bitcoin';

type Params = {
    outputs: ComposeOutput[];
    coinInfo: BitcoinNetworkInfo;
    push: boolean;
    account?: PrecomposeParams['account'];
    feeLevels?: PrecomposeParams['feeLevels'];
    baseFee?: PrecomposeParams['baseFee'];
    floorBaseFee?: PrecomposeParams['floorBaseFee'];
    sequence?: PrecomposeParams['sequence'];
    skipPermutation?: PrecomposeParams['skipPermutation'];
    total: BigNumber;
};

export default class ComposeTransaction extends AbstractMethod<'composeTransaction', Params> {
    discovery?: Discovery;

    init() {
        this.requiredPermissions = ['read', 'write'];

        const { payload } = this;
        // validate incoming parameters
        validateParams(payload, [
            { name: 'outputs', type: 'array', required: true },
            { name: 'coin', type: 'string', required: true },
            { name: 'push', type: 'boolean' },
            { name: 'account', type: 'object' },
            { name: 'feeLevels', type: 'array' },
            { name: 'baseFee', type: 'number' },
            { name: 'floorBaseFee', type: 'boolean' },
            { name: 'sequence', type: 'number' },
            { name: 'skipPermutation', type: 'boolean' },
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

        // there should be only one output when using send-max option
        // if (sendMax && outputs.length > 1) {
        //     throw ERRORS.TypedError('Method_InvalidParameter', 'Only one output allowed when using "send-max" option');
        // }

        // if outputs contains regular items
        // check if total amount is not lower than dust limit
        // if (outputs.find(o => o.type === 'payment') !== undefined && total.lt(coinInfo.dustLimit)) {
        //     throw error 'Total amount is too low';
        // }

        this.useDevice = !payload.account && !payload.feeLevels;

        this.useUi = this.useDevice;

        this.params = {
            outputs,
            coinInfo,
            account: payload.account,
            feeLevels: payload.feeLevels,
            baseFee: payload.baseFee,
            floorBaseFee: payload.floorBaseFee,
            sequence: payload.sequence,
            skipPermutation: payload.skipPermutation,
            push: typeof payload.push === 'boolean' ? payload.push : false,
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

    async precompose(
        account: PrecomposeParams['account'],
        feeLevels: PrecomposeParams['feeLevels'],
    ): Promise<PrecomposedResult[]> {
        const { coinInfo, outputs, baseFee, skipPermutation } = this.params;
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
            skipPermutation,
        });

        // This is mandatory, @trezor/utxo-lib/compose expects current block height
        // TODO: make it possible without it (offline composing)
        const blockchain = await initBlockchain(this.params.coinInfo, this.postMessage);
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

    async run(): Promise<SignedTransaction | PrecomposedResult[]> {
        if (this.params.account && this.params.feeLevels) {
            return this.precompose(this.params.account, this.params.feeLevels);
        }

        // discover accounts and wait for user action
        const { account, utxo } = await this.selectAccount();

        // wait for fee selection
        const response = await this.selectFee(account, utxo);
        // check for interruption
        if (!this.discovery) {
            throw ERRORS.TypedError(
                'Runtime',
                'ComposeTransaction: selectFee response received after dispose',
            );
        }

        if (typeof response === 'string') {
            // back to account selection
            return this.run();
        }
        return response;
    }

    async selectAccount() {
        const { coinInfo } = this.params;
        const blockchain = await initBlockchain(coinInfo, this.postMessage);
        const dfd = this.createUiPromise(UI.RECEIVE_ACCOUNT);

        if (this.discovery && this.discovery.completed) {
            const { discovery } = this;
            this.postMessage(
                createUiMessage(UI.SELECT_ACCOUNT, {
                    type: 'end',
                    coinInfo,
                    accountTypes: discovery.types.map(t => t.type),
                    accounts: discovery.accounts,
                }),
            );
            const uiResp = await dfd.promise;
            const account = discovery.accounts[uiResp.payload];
            const utxo = await blockchain.getAccountUtxo(account.descriptor);
            return {
                account,
                utxo,
            };
        }
        // initialize backend

        const discovery =
            this.discovery ||
            new Discovery({
                blockchain,
                commands: this.device.getCommands(),
            });
        this.discovery = discovery;

        discovery.on('progress', accounts => {
            this.postMessage(
                createUiMessage(UI.SELECT_ACCOUNT, {
                    type: 'progress',
                    // preventEmpty: true,
                    coinInfo,
                    accounts,
                }),
            );
        });
        discovery.on('complete', () => {
            this.postMessage(
                createUiMessage(UI.SELECT_ACCOUNT, {
                    type: 'end',
                    coinInfo,
                }),
            );
        });

        // get accounts with addresses (tokens)
        discovery.start('tokens').catch(error => {
            // catch error from discovery process
            dfd.reject(error);
        });

        // set select account view
        // this view will be updated from discovery events
        this.postMessage(
            createUiMessage(UI.SELECT_ACCOUNT, {
                type: 'start',
                accountTypes: discovery.types.map(t => t.type),
                coinInfo,
            }),
        );

        // wait for user action
        const uiResp = await dfd.promise;
        discovery.removeAllListeners();
        discovery.stop();

        if (!discovery.completed) {
            await resolveAfter(501).promise; // temporary solution, TODO: immediately resolve will cause "device call in progress"
        }

        const account = discovery.accounts[uiResp.payload];
        this.params.coinInfo = fixCoinInfoNetwork(this.params.coinInfo, account.address_n);
        const utxo = await blockchain.getAccountUtxo(account.descriptor);
        return {
            account,
            utxo,
        };
    }

    async selectFee(account: DiscoveryAccount, utxos: AccountUtxo[]) {
        const { coinInfo, outputs } = this.params;

        // get backend instance (it should be initialized before)
        const blockchain = await initBlockchain(coinInfo, this.postMessage);
        const composer = new TransactionComposer({
            account,
            utxos,
            coinInfo,
            outputs,
        });
        await composer.init(blockchain);

        // try to compose multiple transactions with different fee levels
        // check if any of composed transactions is valid
        const hasFunds = composer.composeAllFeeLevels();
        if (!hasFunds) {
            // show error view
            this.postMessage(createUiMessage(UI.INSUFFICIENT_FUNDS));
            // wait few seconds...
            await resolveAfter(2000, null).promise;
            // and go back to discovery
            return 'change-account';
        }

        // set select account view
        // this view will be updated from discovery events
        this.postMessage(
            createUiMessage(UI.SELECT_FEE, {
                feeLevels: composer.getFeeLevelList(),
                coinInfo: this.params.coinInfo,
            }),
        );

        // wait for user action
        return this._selectFeeUiResponse(composer);
    }

    async _selectFeeUiResponse(
        composer: TransactionComposer,
    ): Promise<SignedTransaction | 'change-account'> {
        const resp = await this.createUiPromise(UI.RECEIVE_FEE).promise;
        switch (resp.payload.type) {
            case 'compose-custom':
                // recompose custom fee level with requested value
                composer.composeCustomFee(resp.payload.value);
                this.postMessage(
                    createUiMessage(UI.UPDATE_CUSTOM_FEE, {
                        feeLevels: composer.getFeeLevelList(),
                        coinInfo: this.params.coinInfo,
                    }),
                );

                // wait for user action
                return this._selectFeeUiResponse(composer);

            case 'send':
                return this._sign(composer.composed[resp.payload.value]);

            default:
                return 'change-account';
        }
    }

    async _sign(tx: ComposeResult) {
        if (tx.type !== 'final')
            throw ERRORS.TypedError('Runtime', 'ComposeTransaction: Trying to sign unfinished tx');

        const { coinInfo } = this.params;

        const options = enhanceSignTx({}, coinInfo);
        const inputs = tx.inputs.map(inp => inputToTrezor(inp, this.params.sequence));
        const outputs = tx.outputs.map(outputToTrezor);

        let refTxs: RefTransaction[] = [];
        const requiredRefTxs = requireReferencedTransactions(inputs, options, coinInfo);
        const refTxsIds = getReferencedTransactions(inputs);
        if (requiredRefTxs && refTxsIds.length > 0) {
            const blockchain = await initBlockchain(coinInfo, this.postMessage);
            const rawTxs = await blockchain.getTransactions(refTxsIds);
            refTxs = transformReferencedTransactions(rawTxs, coinInfo);
        }

        const signTxMethod = !this.device.unavailableCapabilities.replaceTransaction
            ? signTx
            : signTxLegacy;
        const response = await signTxMethod({
            typedCall: this.device.getCommands().typedCall.bind(this.device.getCommands()),
            inputs,
            outputs,
            refTxs,
            options,
            coinInfo,
        });

        await verifyTx(
            this.device.getCommands().getHDNode.bind(this.device.getCommands()),
            inputs,
            outputs,
            response.serializedTx,
            coinInfo,
        );

        if (this.params.push) {
            const blockchain = await initBlockchain(coinInfo, this.postMessage);
            const txid = await blockchain.pushTransaction(response.serializedTx);
            return {
                ...response,
                txid,
            };
        }

        return response;
    }

    dispose() {
        const { discovery } = this;
        if (discovery) {
            discovery.stop();
            discovery.removeAllListeners();
            this.discovery = undefined;
        }
    }
}
