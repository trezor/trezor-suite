// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ComposeTransaction.js

import {
    type AccountUtxo,
    type BitcoinNetworkInfo,
    type ComposeResult,
    DEFAULT_SORTING_STRATEGY,
    type DiscoveryAccount,
    ERRORS,
    type MethodPermission,
    type PrecomposeParams,
    type PrecomposedResult,
    type RefTransaction,
    type SignedTransaction,
    UI_REQUEST,
    UI_RESPONSE,
    createUiMessage,
} from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { promiseAllSequence } from '@trezor/utils/src/promiseAllSequence';
import { resolveAfter } from '@trezor/utils/src/resolveAfter';
import { unique } from '@trezor/utils/src/unique';
import type { ComposeOutput, TransactionInputOutputSortingStrategy } from '@trezor/utxo-lib';

import { initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import type { MethodContext, MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { requestExistingAccounts } from './common/requestExistingAccounts';
import { fixCoinInfoNetwork, getBitcoinNetwork } from '../data/coinInfo';
import { formatAmount } from '../utils/formatUtils';
import * as pathUtils from '../utils/pathUtils';
import { TransactionComposer } from './bitcoin/TransactionComposer';
import { enhanceSignTx } from './bitcoin/enhanceSignTx';
import { inputToTrezor } from './bitcoin/inputs';
import { outputToTrezor, validateHDOutput } from './bitcoin/outputs';
import {
    getReferencedTransactions,
    parseTransactionHexes,
    requireReferencedTransactions,
    transformReferencedTransactions,
} from './bitcoin/refTx';
import { signTx } from './bitcoin/signtx';
import { signTxLegacy } from './bitcoin/signtxLegacy';
import { deriveOutputScript, verifyTx } from './bitcoin/signtxVerify';
import { Discovery } from './common/Discovery';
import { validateParams } from './common/paramsValidator';

type Params = {
    outputs: ComposeOutput[];
    coinInfo: BitcoinNetworkInfo;
    identity?: string;
    push: boolean;
    account?: PrecomposeParams['account'];
    feeLevels?: PrecomposeParams['feeLevels'];
    baseFee?: PrecomposeParams['baseFee'];
    floorBaseFee?: PrecomposeParams['floorBaseFee'];
    sequence?: PrecomposeParams['sequence'];
    total: BigNumber;
    sortingStrategy?: TransactionInputOutputSortingStrategy;
};

export default class ComposeTransaction extends AbstractMethod<'composeTransaction', Params> {
    constructor(message: MethodMessage<'composeTransaction'>) {
        const { payload } = message;
        // validate incoming parameters
        validateParams(payload, [
            { name: 'outputs', type: 'array', required: true },
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
            { name: 'push', type: 'boolean' },
            { name: 'account', type: 'object' },
            { name: 'feeLevels', type: 'array' },
            { name: 'baseFee', type: 'number' },
            { name: 'floorBaseFee', type: 'boolean' },
            { name: 'sequence', type: 'number' },
            { name: 'sortingStrategy', type: 'string' },
        ]);

        const coinInfo = getBitcoinNetwork(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // validate backend
        isBackendSupported(coinInfo);

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

        const params = {
            outputs,
            coinInfo,
            identity: payload.identity,
            account: payload.account,
            feeLevels: payload.feeLevels,
            baseFee: payload.baseFee,
            floorBaseFee: payload.floorBaseFee,
            sequence: payload.sequence,
            sortingStrategy: payload.sortingStrategy,
            push: typeof payload.push === 'boolean' ? payload.push : false,
            total,
        };

        super(message, params);

        this.useDevice = !payload.account && !payload.feeLevels;

        this.useUi = this.useDevice;

        this.requiredFirmwareCoins = [coinInfo];
    }

    discovery?: Discovery;

    get requiredPermissions(): MethodPermission[] {
        const permissions: MethodPermission[] = ['read', 'write'];
        if (this.params.push) {
            permissions.push('push_tx');
        }

        return permissions;
    }

    get info() {
        const sendMax = this.params?.outputs.find(o => o.type === 'send-max') !== undefined;

        if (sendMax) {
            return 'Send maximum amount';
        }

        return `Send ${formatAmount(this.params.total.toString(), this.params.coinInfo)}`;
    }

    private getBlockchain(sendCoreMessage: MethodContext['sendCoreMessage']) {
        return initBlockchain(this.params.coinInfo, sendCoreMessage, this.params.identity);
    }

    private async precompose(
        account: PrecomposeParams['account'],
        feeLevels: PrecomposeParams['feeLevels'],
        sendCoreMessage: MethodContext['sendCoreMessage'],
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
        const blockchain = await this.getBlockchain(sendCoreMessage);
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

    async run(context: MethodContext): Promise<SignedTransaction | PrecomposedResult[]> {
        if (this.params.account && this.params.feeLevels) {
            return this.precompose(
                this.params.account,
                this.params.feeLevels,
                context.sendCoreMessage,
            );
        }

        // discover accounts and wait for user action
        const { account, utxo } = await this.selectAccount(context);

        // wait for fee selection
        const response = await this.selectFee(account, utxo, context);
        // check for interruption
        if (!this.discovery) {
            throw ERRORS.TypedError(
                'Runtime',
                'ComposeTransaction: selectFee response received after dispose',
            );
        }

        if (typeof response === 'string') {
            // back to account selection
            return this.run(context);
        }

        return response;
    }

    private async selectAccount(context: MethodContext) {
        const { coinInfo } = this.params;
        const blockchain = await this.getBlockchain(context.sendCoreMessage);

        // Try to get existing accounts from the host (e.g. Suite) to skip device discovery
        if (!this.discovery) {
            const existingAccounts = await requestExistingAccounts({
                postMessage: context.sendCoreMessage,
                createUiPromise: context.createUiPromise,
                device: this.getDevice(),
                coinInfo,
            });

            if (existingAccounts) {
                return this.selectFromExistingAccounts(existingAccounts, blockchain, context);
            }
        }

        return this.selectFromDiscovery(blockchain, context);
    }

    private async selectFromExistingAccounts(
        accounts: DiscoveryAccount[],
        blockchain: Awaited<ReturnType<typeof this.getBlockchain>>,
        context: MethodContext,
    ) {
        const { coinInfo } = this.params;
        const dfd = context.createUiPromise(UI_RESPONSE.RECEIVE_ACCOUNT, this.getDevice());

        context.sendCoreMessage(
            createUiMessage(UI_REQUEST.SELECT_ACCOUNT, {
                type: 'complete',
                accountTypes: unique(accounts.map(a => a.type)),
                coinInfo,
                accounts,
            }),
        );

        const uiResp = await dfd.promise;
        const account = accounts[uiResp.payload];
        this.params.coinInfo = fixCoinInfoNetwork(this.params.coinInfo, account.address_n);
        const utxo = await blockchain.getAccountUtxo(account.descriptor);

        return { account, utxo };
    }

    private async selectFromDiscovery(
        blockchain: Awaited<ReturnType<typeof this.getBlockchain>>,
        context: MethodContext,
    ) {
        const { coinInfo } = this.params;
        const dfd = context.createUiPromise(UI_RESPONSE.RECEIVE_ACCOUNT, this.getDevice());

        if (this.discovery && this.discovery.completed) {
            const { discovery } = this;
            context.sendCoreMessage(
                createUiMessage(
                    UI_REQUEST.SELECT_ACCOUNT,
                    {
                        type: 'end',
                        coinInfo,
                        accountTypes: discovery.types.map(t => t.type),
                        accounts: discovery.accounts,
                    },
                    dfd.requestId,
                ),
            );
            const uiResp = await dfd.promise;
            const account = discovery.accounts[uiResp.payload];
            const utxo = await blockchain.getAccountUtxo(account.descriptor);

            return { account, utxo };
        }

        const discovery =
            this.discovery ||
            new Discovery({
                blockchain,
                getDescriptor: path =>
                    this.getDevice().getCommands().getAccountDescriptor(this.params.coinInfo, path),
            });
        this.discovery = discovery;

        discovery.on('progress', accounts => {
            context.sendCoreMessage(
                createUiMessage(
                    UI_REQUEST.SELECT_ACCOUNT,
                    {
                        type: 'progress',
                        coinInfo,
                        accounts,
                    },
                    dfd.requestId,
                ),
            );
        });
        discovery.on('complete', () => {
            context.sendCoreMessage(
                createUiMessage(
                    UI_REQUEST.SELECT_ACCOUNT,
                    {
                        type: 'end',
                        coinInfo,
                    },
                    dfd.requestId,
                ),
            );
        });

        // get accounts with addresses (tokens)
        discovery.start('tokens').catch(error => {
            // catch error from discovery process
            dfd.reject(error);
        });

        // set select account view
        // this view will be updated from discovery events
        context.sendCoreMessage(
            createUiMessage(
                UI_REQUEST.SELECT_ACCOUNT,
                {
                    type: 'start',
                    accountTypes: discovery.types.map(t => t.type),
                    coinInfo,
                },
                dfd.requestId,
            ),
        );

        // wait for user action
        const uiResp = await dfd.promise;
        discovery.removeAllListeners();
        discovery.stop();

        if (!discovery.completed) {
            await resolveAfter(501); // temporary solution, TODO: immediately resolve will cause "device call in progress"
        }

        const account = discovery.accounts[uiResp.payload];
        this.params.coinInfo = fixCoinInfoNetwork(this.params.coinInfo, account.address_n);
        const utxo = await blockchain.getAccountUtxo(account.descriptor);

        return { account, utxo };
    }

    private async selectFee(
        account: DiscoveryAccount,
        utxos: AccountUtxo[],
        context: MethodContext,
    ) {
        const { coinInfo, outputs, sortingStrategy } = this.params;

        // get backend instance (it should be initialized before)
        const blockchain = await this.getBlockchain(context.sendCoreMessage);
        const composer = new TransactionComposer({
            account,
            utxos,
            coinInfo,
            outputs,
            sortingStrategy: sortingStrategy ?? DEFAULT_SORTING_STRATEGY,
        });
        await composer.init(blockchain);

        // try to compose multiple transactions with different fee levels
        // check if any of composed transactions is valid
        const hasFunds = composer.composeAllFeeLevels();
        if (!hasFunds) {
            // show error view
            context.sendCoreMessage(createUiMessage(UI_REQUEST.INSUFFICIENT_FUNDS));
            // wait few seconds...
            await resolveAfter(2000);

            // and go back to discovery
            return 'change-account';
        }

        // set select account view
        // this view will be updated from discovery events
        context.sendCoreMessage(
            createUiMessage(UI_REQUEST.SELECT_FEE, {
                feeLevels: composer.getFeeLevelList(),
                coinInfo: this.params.coinInfo,
            }),
        );

        // wait for user action
        return this._selectFeeUiResponse(composer, context);
    }

    private async _selectFeeUiResponse(
        composer: TransactionComposer,
        context: MethodContext,
    ): Promise<SignedTransaction | 'change-account'> {
        const resp = await context.createUiPromise(UI_RESPONSE.RECEIVE_FEE, this.getDevice())
            .promise;
        switch (resp.payload.type) {
            case 'compose-custom':
                // recompose custom fee level with requested value
                composer.composeCustomFee(resp.payload.value);
                context.sendCoreMessage(
                    createUiMessage(
                        UI_REQUEST.UPDATE_CUSTOM_FEE,
                        {
                            feeLevels: composer.getFeeLevelList(),
                            coinInfo: this.params.coinInfo,
                        },
                        resp.requestId,
                    ),
                );

                // wait for user action
                return this._selectFeeUiResponse(composer, context);

            case 'send':
                return this._sign(composer.composed[resp.payload.value], context.sendCoreMessage);

            default:
                return 'change-account';
        }
    }

    private async _sign(tx: ComposeResult, sendCoreMessage: MethodContext['sendCoreMessage']) {
        const device = this.getDevice();
        const { params } = this;

        if (tx.type !== 'final')
            throw ERRORS.TypedError('Runtime', 'ComposeTransaction: Trying to sign unfinished tx');

        const { coinInfo } = params;

        const options = enhanceSignTx({}, coinInfo);
        const inputs = tx.inputs.map(inp => inputToTrezor(inp, params.sequence));
        const outputs = tx.outputs.map(outputToTrezor);

        let refTxs: RefTransaction[] = [];
        const requiredRefTxs = requireReferencedTransactions(inputs, options, coinInfo);
        const refTxsIds = getReferencedTransactions(inputs);
        if (requiredRefTxs && refTxsIds.length > 0) {
            refTxs = await this.getBlockchain(sendCoreMessage)
                .then(blockchain => blockchain.getTransactionHexes(refTxsIds))
                .then(parseTransactionHexes(coinInfo.network))
                .then(transformReferencedTransactions);
        }

        const getHDNode = (address_n: number[]) =>
            device.getCommands().getHDNode({ address_n }, { coinInfo: params.coinInfo });

        const outputScripts = await promiseAllSequence(
            outputs.map(output => () => deriveOutputScript(getHDNode, output, coinInfo.network)),
        );

        const signTxMethod = !device.unavailableCapabilities.replaceTransaction
            ? signTx
            : signTxLegacy;

        const cmd = device.getCommands();
        const response = await signTxMethod({
            typedCall: cmd.typedCall,
            inputs,
            outputs,
            refTxs,
            options,
            coinInfo,
        });

        verifyTx(response.serializedTx, {
            inputs,
            outputs,
            outputScripts,
            network: coinInfo.network,
        });

        if (params.push) {
            const blockchain = await this.getBlockchain(sendCoreMessage);
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
