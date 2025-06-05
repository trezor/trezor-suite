// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/SignTransaction.js

import { BigNumber } from '@trezor/utils/src/bigNumber';

import { ERRORS, PROTO } from '../constants';
import {
    createPendingTransaction,
    enhanceSignTx,
    enhanceTrezorInputs,
    getOrigTransactions,
    getReferencedTransactions,
    parseTransactionHexes,
    requireReferencedTransactions,
    signTx,
    signTxLegacy,
    transformOrigTransactions,
    transformReferencedTransactions,
    validateReferencedTransactions,
    validateTrezorInputs,
    validateTrezorOutputs,
    verifyTicketTx,
    verifyTx,
} from './bitcoin';
import { Blockchain, initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import { AbstractMethod } from '../core/AbstractMethod';
import type { AccountAddresses, BitcoinNetworkInfo } from '../types';
import { getFirmwareRange, validateParams } from './common/paramsValidator';
import { getBitcoinNetwork } from '../data/coinInfo';
import type { RefTransaction, TransactionOptions } from '../types/api/bitcoin';
import { getLabel } from '../utils/pathUtils';
import { getTransactionVbytes } from './bitcoin/transactionBytes';

type Params = {
    inputs: PROTO.TxInputType[];
    outputs: PROTO.TxOutputType[];
    paymentRequests: PROTO.TxAckPaymentRequest[];
    coinjoinRequest?: PROTO.CoinJoinRequest;
    refTxs?: RefTransaction[];
    addresses?: AccountAddresses;
    options: TransactionOptions;
    coinInfo: BitcoinNetworkInfo;
    identity?: string;
    push: boolean;
    unlockPath?: PROTO.UnlockPath;
};

export default class SignTransaction extends AbstractMethod<'signTransaction', Params> {
    init() {
        this.requiredPermissions = ['read', 'write'];

        const { payload } = this;

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
            { name: 'decredStakingTicket', type: 'boolean' },
            { name: 'push', type: 'boolean' },
            { name: 'preauthorized', type: 'boolean' },
            { name: 'amountUnit', type: ['number', 'string'] },
            { name: 'unlockPath', type: 'object' },
            { name: 'serialize', type: 'boolean' },
            { name: 'chunkify', type: 'boolean' },
        ]);

        if (payload.unlockPath) {
            validateParams(payload.unlockPath, [
                { name: 'address_n', required: true, type: 'array' },
                { name: 'mac', required: true, type: 'string' },
            ]);
        }

        const coinInfo = getBitcoinNetwork(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // set required firmware from coinInfo support
        this.firmwareRange = getFirmwareRange(this.name, coinInfo, this.firmwareRange);
        this.preauthorized = payload.preauthorized;

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

        if (payload.refTxs && payload.account?.transactions) {
            console.warn(
                'two sources of referential transactions were passed. payload.refTxs have precedence',
            );
        }
        const refTxs = validateReferencedTransactions({
            transactions: payload.refTxs || payload.account?.transactions,
            inputs,
            outputs,
            coinInfo,
            addresses: payload.account?.addresses,
        });

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

        this.params = {
            inputs,
            outputs,
            paymentRequests: payload.paymentRequests ?? [],
            refTxs,
            addresses: payload.account ? payload.account.addresses : undefined,
            options: {
                lock_time: payload.locktime,
                timestamp: payload.timestamp,
                version: payload.version,
                expiry: payload.expiry,
                overwintered: payload.overwintered,
                version_group_id: payload.versionGroupId,
                branch_id: payload.branchId,
                decred_staking_ticket: payload.decredStakingTicket,
                amount_unit: payload.amountUnit,
                serialize: payload.serialize,
                coinjoin_request: payload.coinjoinRequest,
                chunkify: typeof payload.chunkify === 'boolean' ? payload.chunkify : false,
            },
            coinInfo,
            identity: payload.identity,
            push: typeof payload.push === 'boolean' ? payload.push : false,
            unlockPath: payload.unlockPath,
        };

        this.params.options = enhanceSignTx(this.params.options, coinInfo);

        if (this.params.push) {
            this.requiredPermissions.push('push_tx');
        }
    }

    get info() {
        const coinInfo = getBitcoinNetwork(this.payload.coin);

        return getLabel('Sign #NETWORK transaction', coinInfo);
    }

    async payloadToPrecomposed() {
        try {
            const { inputs, outputs, coinInfo } = this.params;
            const refTxs = this.params.refTxs ?? (await this.fetchRefTxs(false));
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

            return {
                type: 'final' as const,
                inputs,
                outputs,
                outputsPermutation: Array.from({ length: outputs.length }, (_, i) => i),
                totalSpent: inputsTotal.toString(),
                fee: fee.toString(),
                feePerByte: feePerByte.toString(),
                bytes,
            };
        } catch (e) {
            // Don't throw errors from this method
            console.error('Error in payloadToPrecomposed', e);

            return undefined;
        }
    }

    private async fetchAddresses(blockchain: Blockchain) {
        const {
            device,
            params: { inputs, coinInfo },
        } = this;

        // TODO: validate inputs address_n's === same account
        const accountPath = inputs.find(i => i.address_n);
        if (!accountPath || !accountPath.address_n) {
            throw ERRORS.TypedError('Runtime', 'Account not found');
        }
        const address_n = accountPath.address_n.slice(0, 3);
        const node = await device.getCommands().getHDNode({ address_n }, { coinInfo });
        const account = await blockchain.getAccountInfo({
            descriptor: node.xpubSegwit || node.xpub,
            details: 'tokens',
        });

        return account.addresses;
    }

    private async fetchRefTxs(useLegacySignProcess: boolean) {
        const {
            params: { inputs, outputs, options, coinInfo, identity, addresses },
        } = this;

        const requiredRefTxs = requireReferencedTransactions(inputs, options, coinInfo);
        const refTxsIds = requiredRefTxs ? getReferencedTransactions(inputs) : [];
        const origTxsIds = !useLegacySignProcess ? getOrigTransactions(inputs, outputs) : [];

        if (!refTxsIds.length && !origTxsIds.length) {
            return [];
        }

        // validate and initialize backend
        isBackendSupported(coinInfo);
        const blockchain = await initBlockchain(coinInfo, this.postMessage, identity);

        const refTxs = !refTxsIds.length
            ? []
            : await blockchain
                  .getTransactionHexes(refTxsIds)
                  .then(parseTransactionHexes(coinInfo.network))
                  .then(rawTxs => {
                      enhanceTrezorInputs(this.params.inputs, rawTxs);

                      return transformReferencedTransactions(rawTxs);
                  });

        const origTxs = !origTxsIds.length
            ? []
            : await blockchain
                  .getTransactionHexes(origTxsIds)
                  .then(parseTransactionHexes(coinInfo.network))
                  .then(async rawOrigTxs => {
                      // if sender account addresses not provided, fetch account info from the blockbook
                      const accountAddresses = addresses ?? (await this.fetchAddresses(blockchain));
                      if (!accountAddresses) return [];

                      return transformOrigTransactions(
                          rawOrigTxs,
                          coinInfo,
                          inputs,
                          accountAddresses,
                      );
                  });

        return refTxs.concat(origTxs);
    }

    async run() {
        const { device, params } = this;
        const useLegacySignProcess = !!device.unavailableCapabilities.replaceTransaction;
        const refTxs = params.refTxs ?? (await this.fetchRefTxs(useLegacySignProcess));

        if (this.preauthorized) {
            await device.getCommands().preauthorize(true);
        } else if (params.unlockPath) {
            await device.getCommands().unlockPath(params.unlockPath);
        }

        const signTxMethod = !useLegacySignProcess ? signTx : signTxLegacy;
        const response = await signTxMethod({
            ...params,
            refTxs,
            typedCall: device.getCommands().typedCall,
        });

        // return only signatures, using option `serialize: false`
        if (!response.serializedTx) {
            return response;
        }

        let bitcoinTx: Awaited<ReturnType<typeof verifyTx>> | undefined;
        if (params.options.decred_staking_ticket) {
            await verifyTicketTx(
                device.getCommands().getHDNode,
                params.inputs,
                params.outputs,
                response.serializedTx,
                params.coinInfo,
            );
        } else {
            bitcoinTx = await verifyTx(
                device.getCommands().getHDNode,
                params.inputs,
                params.outputs,
                response.serializedTx,
                params.coinInfo,
                params.unlockPath,
            );

            if (bitcoinTx.hasWitnesses()) {
                response.witnesses = bitcoinTx.ins.map((_, i) =>
                    bitcoinTx?.getWitness(i)?.toString('hex'),
                );
            }
        }

        if (bitcoinTx && params.addresses) {
            response.signedTransaction = createPendingTransaction(bitcoinTx, {
                addresses: params.addresses,
                inputs: params.inputs,
                outputs: params.outputs,
            });
        }

        if (params.push) {
            // validate backend
            isBackendSupported(params.coinInfo);
            const blockchain = await initBlockchain(
                params.coinInfo,
                this.postMessage,
                params.identity,
            );
            const txid = await blockchain.pushTransaction(response.serializedTx);

            return {
                ...response,
                txid,
            };
        }

        return response;
    }
}
