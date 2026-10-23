// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/SignTransaction.js

import {
    type AccountAddresses,
    type BitcoinNetworkInfo,
    type PROTO,
    type PermissionRequest,
    type RefTransaction,
    type TransactionOptions,
    getOriginalTxids,
    getPreviousTxids,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { TypedError } from '@trezor/connect-common/src/constants/errors';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { promiseAllSequence } from '@trezor/utils/src/promiseAllSequence';

import {
    assertRefTransactions,
    createPendingTransaction,
    deriveOutputScript,
    enhanceSignTx,
    signTx,
    transformRawTransactions,
    validateTrezorInputs,
    validateTrezorOutputs,
    verifyTx,
} from './bitcoin';
import { assertBackendSupported, initBlockchain } from '../backend/BlockchainLink';
import type { MethodContext, MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getBitcoinNetworkOrThrow } from '../data/coinInfo';
import { getLabel } from '../utils/pathUtils';
import { PAYMENT_REQUEST_AMOUNT_BYTES, encodePaymentRequestAmount } from '../utils/paymentRequest';
import { getTransactionVbytes } from './bitcoin/transactionBytes';
import { validateParams } from './common/paramsValidator';

type Params = {
    inputs: PROTO.TxInputType[];
    outputs: PROTO.TxOutputType[];
    paymentRequests: PROTO.PaymentRequest[];
    refTxs: RefTransaction[];
    addresses?: AccountAddresses;
    options: TransactionOptions;
    coinInfo: BitcoinNetworkInfo;
    identity?: string;
    push: boolean;
    unlockPath?: PROTO.UnlockPath;
};

export default class SignTransaction extends AbstractMethod<'signTransaction', Params> {
    constructor(message: MethodMessage<'signTransaction'>) {
        const { payload } = message;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
            { name: 'inputs', type: 'array', required: true },
            { name: 'outputs', type: 'array', required: true },
            { name: 'paymentRequests', type: 'array', allowEmpty: true },
            { name: 'coinjoinRequest', type: 'object' },
            { name: 'refTxs', type: 'array', allowEmpty: true },
            { name: 'account', type: 'object' },
            { name: 'locktime', type: 'number' },
            { name: 'timestamp', type: 'number' },
            { name: 'version', type: 'number' },
            { name: 'expiry', type: 'number' },
            { name: 'overwintered', type: 'boolean' },
            { name: 'versionGroupId', type: 'number' },
            { name: 'branchId', type: 'number' },
            { name: 'push', type: 'boolean' },
            { name: 'preauthorized', type: 'boolean' },
            { name: 'amountUnit', type: ['number', 'string'] },
            { name: 'unlockPath', type: 'object' },
            { name: 'serialize', type: 'boolean' },
            { name: 'chunkify', type: 'boolean' },
        ]);

        if (payload.account) {
            validateParams(payload.account, [
                { name: 'addresses', type: 'object' },
                { name: 'transactions', type: 'array', allowEmpty: true },
            ]);

            payload.account.transactions?.forEach(tx =>
                validateParams(tx, [
                    { name: 'txid', type: 'string' },
                    { name: 'hex', type: 'string' },
                ]),
            );
        }

        if (payload.unlockPath) {
            validateParams(payload.unlockPath, [
                { name: 'address_n', required: true, type: 'array' },
                { name: 'mac', required: true, type: 'string' },
            ]);
        }

        const coinInfo = getBitcoinNetworkOrThrow(payload.coin);

        const inputs = validateTrezorInputs(payload.inputs, coinInfo);
        const outputs = validateTrezorOutputs(payload.outputs, coinInfo);

        /**
         * Used to sign the transaction according to SLIP-24.
         * The `payment_req_index` is the index of the PaymentRequest containing this output.
         * Currently, `paymentRequests` are used only for trading, and there is a maximum of one PaymentRequests per transaction, therefore payment_req_index = 0.
         */
        if (payload.paymentRequests && payload.paymentRequests.length > 0) {
            outputs.forEach(output => {
                output.payment_req_index = 0;
            });
        }

        const prevTxids = getPreviousTxids(inputs, { version: payload.version }, coinInfo);
        const origTxids = getOriginalTxids(inputs, outputs);

        let refTxs: RefTransaction[] = [];

        if (payload.refTxs?.length) {
            if (payload.account?.transactions) {
                console.warn(
                    'two sources of referential transactions were passed. payload.refTxs have precedence',
                );
            }
            assertRefTransactions({ transactions: payload.refTxs, origTxids });

            refTxs = payload.refTxs;
        } else if (payload.account?.transactions?.length) {
            refTxs = transformRawTransactions({
                transactions: payload.account.transactions,
                inputs,
                origTxids,
                coinInfo,
                addresses: payload.account?.addresses,
            });
        }

        const missing = prevTxids
            .concat(origTxids)
            .find(hash => !refTxs.some(tx => tx.hash === hash));
        if (missing) {
            throw TypedError('Method_InvalidParameter', `refTx: ${missing} not provided`);
        }

        const outputsWithAmount = outputs.filter(
            output =>
                typeof output.amount === 'string' &&
                !Object.prototype.hasOwnProperty.call(output, 'op_return_data'),
        );
        if (outputsWithAmount.length > 0) {
            const total: BigNumber = outputsWithAmount.reduce(
                (bn, output) => bn.plus(typeof output.amount === 'string' ? output.amount : '0'),
                new BigNumber(0),
            );
            if (total.lt(coinInfo.dustLimit)) {
                throw ERRORS.TypedError(
                    'Method_InvalidParameter',
                    'Total amount is below dust limit.',
                );
            }
        }
        const paymentRequests =
            payload.paymentRequests?.map(p =>
                encodePaymentRequestAmount(p, PAYMENT_REQUEST_AMOUNT_BYTES.DEFAULT),
            ) ?? [];

        const params = {
            inputs,
            outputs,
            paymentRequests,
            refTxs,
            addresses: payload.account ? payload.account.addresses : undefined,
            options: enhanceSignTx(
                {
                    lock_time: payload.locktime,
                    timestamp: payload.timestamp,
                    version: payload.version,
                    expiry: payload.expiry,
                    overwintered: payload.overwintered,
                    version_group_id: payload.versionGroupId,
                    branch_id: payload.branchId,
                    amount_unit: payload.amountUnit,
                    serialize: payload.serialize,
                    coinjoin_request: payload.coinjoinRequest,
                    chunkify: typeof payload.chunkify === 'boolean' ? payload.chunkify : false,
                },
                coinInfo,
            ),
            coinInfo,
            identity: payload.identity,
            push: typeof payload.push === 'boolean' ? payload.push : false,
            unlockPath: payload.unlockPath,
        };

        super(message, params);

        this.requiredFirmwareCoins = [coinInfo];
        this.preauthorized = payload.preauthorized;
    }

    get requiredPermissions(): PermissionRequest[] {
        const permissions: PermissionRequest[] = [this.coinPerm('sign', this.params.coinInfo)];
        if (this.params.push) {
            permissions.push(this.coinPerm('push_tx', this.params.coinInfo));
        }
        // Preauthorized signing runs under the coinjoin authorization of the device session, so it
        // shares the internal tier of authorizeCoinjoin, which creates that authorization.
        if (this.preauthorized) {
            permissions.push(this.coinPerm('internal', this.params.coinInfo));
        }

        return permissions;
    }

    get info() {
        return getLabel('Sign #NETWORK transaction', this.params.coinInfo);
    }

    payloadToPrecomposed() {
        try {
            const { inputs, outputs, coinInfo, refTxs } = this.params;
            const inputsTotal: BigNumber = inputs.reduce((bn, input) => {
                if (typeof input.amount === 'string') {
                    return bn.plus(input.amount);
                } else {
                    const refTx = refTxs.find(tx => tx.hash === input.prev_hash);
                    const refOutput =
                        refTx?.outputs?.[input.prev_index] ??
                        refTx?.bin_outputs?.[input.prev_index];
                    if (refOutput) return bn.plus(refOutput.amount);
                }

                return bn;
            }, new BigNumber(0));
            const outputsTotal: BigNumber = outputs.reduce(
                (bn, output) => bn.plus(typeof output.amount === 'string' ? output.amount : '0'),
                new BigNumber(0),
            );
            const bytes = getTransactionVbytes(inputs, outputs, coinInfo);
            if (!bytes) throw ERRORS.TypedError('Runtime', 'Transaction bytes not calculated');
            const fee = inputsTotal.minus(outputsTotal);
            if (fee.lte(0)) {
                throw ERRORS.TypedError('Runtime', 'Computed fee is non-positive');
            }
            const feePerByte = fee.dividedBy(bytes);

            const result = {
                type: 'final' as const,
                inputs,
                outputs,
                outputsPermutation: Array.from({ length: outputs.length }, (_, i) => i),
                totalSpent: inputsTotal.toString(),
                fee: fee.toString(),
                feePerByte: feePerByte.toString(),
                bytes,
            };

            return Promise.resolve(result);
        } catch (e) {
            // Don't throw errors from this method
            console.error('Error in payloadToPrecomposed', e);

            return Promise.resolve(undefined);
        }
    }

    async run({ sendCoreMessage }: MethodContext) {
        const device = this.getDevice();
        const { params } = this;
        const { inputs, outputs, coinInfo, refTxs } = params;

        let outputScripts: Awaited<ReturnType<typeof deriveOutputScript>>[] = [];
        if (params.options.serialize !== false) {
            const getHDNode = (address_n: number[]) =>
                device
                    .getCommands()
                    .getHDNode({ address_n }, { coinInfo, unlockPath: params.unlockPath });

            outputScripts = await promiseAllSequence(
                outputs.map(
                    output => () => deriveOutputScript(getHDNode, output, coinInfo.network),
                ),
            );
        }

        if (this.preauthorized) {
            await device.getCommands().preauthorize(true);
        } else if (params.unlockPath) {
            await device.getCommands().unlockPath(params.unlockPath);
        }

        device.startPiggybackAck();
        const response = await signTx({
            ...params,
            refTxs,
            typedCall: device.getCommands().typedCall,
        });
        await device.stopPiggybackAck();

        // return only signatures, using option `serialize: false`
        if (!response.serializedTx) {
            return response;
        }

        const bitcoinTx = verifyTx(response.serializedTx, {
            inputs,
            outputs,
            outputScripts,
            network: coinInfo.network,
        });
        if (bitcoinTx.hasWitnesses()) {
            response.witnesses = bitcoinTx.ins.map((_, i) =>
                bitcoinTx?.getWitness(i)?.toString('hex'),
            );
        }

        if (bitcoinTx && params.addresses) {
            response.signedTransaction = createPendingTransaction(bitcoinTx, {
                addresses: params.addresses,
                inputs,
                outputs,
            });
        }

        if (params.push) {
            // validate backend
            assertBackendSupported(coinInfo);
            const blockchain = await initBlockchain(coinInfo, sendCoreMessage, params.identity);
            const txid = await blockchain.pushTransaction(response.serializedTx);

            return {
                ...response,
                txid,
            };
        }

        return response;
    }
}
