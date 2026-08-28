import {
    type BitcoinNetworkInfo,
    type ComposeParams,
    type ComposeResultFinal,
    DEFAULT_SORTING_STRATEGY,
    type DiscoveryAccount,
    ERRORS,
    type FeeLevel,
    type PermissionRequest,
    type RefTransaction,
    type SignedTransaction,
    UI_EVENTS,
    UI_REQUESTS,
    UI_RESPONSE,
    createUiEventMessage,
    createUiRequestMessage,
} from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { promiseAllSequence } from '@trezor/utils/src/promiseAllSequence';
import { resolveAfter } from '@trezor/utils/src/resolveAfter';
import { unique } from '@trezor/utils/src/unique';
import type { ComposeOutput } from '@trezor/utxo-lib';

import { assertBackendSupported, initBlockchain } from '../backend/BlockchainLink';
import type { MethodContext, MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { requestExistingAccounts } from './common/requestExistingAccounts';
import { fixCoinInfoNetwork, getBitcoinNetwork } from '../data/coinInfo';
import { formatAmount } from '../utils/formatUtils';
import { createComposer } from './bitcoin/TransactionComposer';
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
import { deriveOutputScript, verifyTx } from './bitcoin/signtxVerify';
import { Discovery } from './common/Discovery';
import { validateParams } from './common/paramsValidator';
import { getOrInitFeeLevels } from '../backend/fees';

type Params = Omit<ComposeParams, 'coin' | 'outputs'> & {
    outputs: ComposeOutput[];
    coinInfo: BitcoinNetworkInfo;
    push: boolean;
    identity?: string;
    total: BigNumber;
};

export default class SendTransaction extends AbstractMethod<'sendTransaction', Params> {
    constructor(message: MethodMessage<'sendTransaction'>) {
        const { payload } = message;
        // validate incoming parameters
        validateParams(payload, [
            { name: 'outputs', type: 'array', required: true },
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
            { name: 'push', type: 'boolean' },
            { name: 'baseFee', type: 'number' },
            { name: 'sequence', type: 'number' },
            { name: 'sortingStrategy', type: 'string' },
        ]);

        const coinInfo = getBitcoinNetwork(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // validate backend
        assertBackendSupported(coinInfo);

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

        const params = {
            outputs,
            coinInfo,
            identity: payload.identity,
            baseFee: payload.baseFee,
            sequence: payload.sequence,
            sortingStrategy: payload.sortingStrategy,
            push: typeof payload.push === 'boolean' ? payload.push : false,
            total,
        };

        super(message, params);

        this.requiredFirmwareCoins = [coinInfo];
    }

    discovery?: Discovery;
    private disposed = false;

    get requiredPermissions(): PermissionRequest[] {
        const permissions: PermissionRequest[] = [this.coinPerm('sign', this.params.coinInfo)];
        if (this.params.push) {
            permissions.push(this.coinPerm('push_tx', this.params.coinInfo));
        }

        return permissions;
    }

    get info() {
        const sendMax = this.params.outputs.some(o => o.type === 'send-max');

        if (sendMax) {
            return 'Send maximum amount';
        }

        return `Send ${formatAmount(this.params.total.toString(), this.params.coinInfo)}`;
    }

    private getBlockchain(sendCoreMessage: MethodContext['sendCoreMessage']) {
        return initBlockchain(this.params.coinInfo, sendCoreMessage, this.params.identity);
    }

    run(context: MethodContext) {
        return this.interactiveFlow(context);
    }

    private async interactiveFlow(context: MethodContext): Promise<SignedTransaction> {
        // discover accounts and wait for user action
        const { account, utxo: utxos } = await this.selectAccount(context);

        const { coinInfo, outputs, sortingStrategy, push } = this.params;

        // get backend instance (it should be initialized before)
        const blockchain = await this.getBlockchain(context.sendCoreMessage);
        const feeLevels = getOrInitFeeLevels(coinInfo);
        await feeLevels.load(blockchain);

        const compose = createComposer({
            txType: account.type,
            addresses: account.addresses,
            utxos,
            coinInfo,
            outputs,
            sortingStrategy: sortingStrategy ?? DEFAULT_SORTING_STRATEGY,
        });

        const levels: FeeLevel[] = [];
        const transactions = new Map<FeeLevel['label'], ComposeResultFinal>();
        const composed = { levels, transactions };

        // try to compose multiple transactions with different fee levels
        // check if any of composed transactions is valid
        for (const level of feeLevels.levels) {
            if (level.feePerUnit === '0') continue;
            const tx = compose(level.feePerUnit);
            if (tx.type !== 'final') continue;
            composed.levels.push(level);
            composed.transactions.set(level.label, tx);
        }

        if (!composed.levels.length) {
            const feePerUnit = String(coinInfo.minFee);
            const minFeeTx = compose(feePerUnit);

            if (minFeeTx.type === 'final') {
                context.sendCoreMessage(
                    createUiRequestMessage(UI_REQUESTS.REQUEST_FEE, {
                        feeLevels: [{ label: 'custom', blocks: -1, feePerUnit }],
                        coinInfo: this.params.coinInfo,
                    }),
                );
            } else {
                // show error view
                context.sendCoreMessage(createUiEventMessage(UI_EVENTS.ACCOUNT_INSUFFICIENT_FUNDS));
                // wait few seconds...
                await resolveAfter(2000);

                // and go back to discovery
                return this.interactiveFlow(context);
            }
        } else {
            // set select account view
            // this view will be updated from discovery events
            context.sendCoreMessage(
                createUiRequestMessage(UI_REQUESTS.REQUEST_FEE, {
                    feeLevels: composed.levels,
                    coinInfo: this.params.coinInfo,
                }),
            );
        }

        // wait for fee selection
        const resp = await context.createUiPromise(UI_RESPONSE.RECEIVE_FEE, this.getDevice())
            .promise;

        if (resp.payload.type === 'change-account') {
            // check for interruption
            if (this.disposed) {
                throw ERRORS.TypedError(
                    'Runtime',
                    'SendTransaction: selectFee response received after dispose',
                );
            }

            // back to account selection
            return this.interactiveFlow(context);
        }

        const tx =
            resp.payload.type === 'select-fee-custom'
                ? compose(resp.payload.value) // recompose custom fee level with requested value
                : composed.transactions.get(resp.payload.value);

        if (tx?.type !== 'final') {
            throw ERRORS.TypedError('Runtime', 'SendTransaction: Trying to sign unfinished tx');
        }

        const response = await this._sign(tx, context.sendCoreMessage);

        if (push) {
            const blockchain2 = await this.getBlockchain(context.sendCoreMessage);
            const txid = await blockchain2.pushTransaction(response.serializedTx);

            return {
                ...response,
                txid,
            };
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
            createUiRequestMessage(UI_REQUESTS.REQUEST_ACCOUNT, {
                type: 'complete',
                accountTypes: unique(accounts.map(a => a.type)),
                coinInfo,
                accounts,
            }),
        );

        const uiResp = await dfd.promise;
        const accountIndex = uiResp.payload;
        // @ts-expect-error: noUncheckedIndexedAccess
        const account: (typeof accounts)[number] = accounts[accountIndex];
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

        if (this.discovery?.completed) {
            const { discovery } = this;
            context.sendCoreMessage(
                createUiRequestMessage(
                    UI_REQUESTS.REQUEST_ACCOUNT,
                    {
                        type: 'end',
                        coinInfo,
                        accountTypes: discovery.types.map(t => t.type),
                        accounts: discovery.accounts,
                    },
                    { requestId: dfd.requestId },
                ),
            );
            const uiResp = await dfd.promise;
            const { accounts } = discovery;
            const accountIndex = uiResp.payload;
            // @ts-expect-error: noUncheckedIndexedAccess
            const account: (typeof accounts)[number] = accounts[accountIndex];
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
                createUiRequestMessage(
                    UI_REQUESTS.REQUEST_ACCOUNT,
                    {
                        type: 'progress',
                        coinInfo,
                        accounts,
                    },
                    { requestId: dfd.requestId },
                ),
            );
        });
        discovery.on('complete', () => {
            context.sendCoreMessage(
                createUiRequestMessage(
                    UI_REQUESTS.REQUEST_ACCOUNT,
                    {
                        type: 'end',
                        coinInfo,
                    },
                    { requestId: dfd.requestId },
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
            createUiRequestMessage(
                UI_REQUESTS.REQUEST_ACCOUNT,
                {
                    type: 'start',
                    accountTypes: discovery.types.map(t => t.type),
                    coinInfo,
                },
                { requestId: dfd.requestId },
            ),
        );

        // wait for user action
        const uiResp = await dfd.promise;
        discovery.removeAllListeners();
        discovery.stop();

        if (!discovery.completed) {
            await resolveAfter(501); // temporary solution, TODO: immediately resolve will cause "device call in progress"
        }

        const { accounts } = discovery;
        const accountIndex = uiResp.payload;
        // @ts-expect-error: noUncheckedIndexedAccess
        const account: (typeof accounts)[number] = accounts[accountIndex];
        this.params.coinInfo = fixCoinInfoNetwork(this.params.coinInfo, account.address_n);
        const utxo = await blockchain.getAccountUtxo(account.descriptor);

        return { account, utxo };
    }

    private async _sign(tx: ComposeResultFinal, sendCoreMessage: MethodContext['sendCoreMessage']) {
        const device = this.getDevice();
        const { params } = this;

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

        const cmd = device.getCommands();
        const response = await signTx({
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

        return response;
    }

    dispose() {
        this.disposed = true;
        const { discovery } = this;
        if (discovery) {
            discovery.stop();
            discovery.removeAllListeners();
            this.discovery = undefined;
        }
    }
}
