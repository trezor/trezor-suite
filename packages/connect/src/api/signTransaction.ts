// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/SignTransaction.js

import BigNumber from 'bignumber.js';
import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams, getFirmwareRange } from './common/paramsValidator';
import { getBitcoinNetwork } from '../data/coinInfo';
import { getLabel } from '../utils/pathUtils';
import { PROTO, ERRORS } from '../constants';
import { isBackendSupported, initBlockchain } from '../backend/BlockchainLink';
import {
    requireReferencedTransactions,
    getReferencedTransactions,
    validateReferencedTransactions,
    transformReferencedTransactions,
    getOrigTransactions,
    transformOrigTransactions,
    validateTrezorInputs,
    validateTrezorOutputs,
    enhanceTrezorInputs,
    enhanceSignTx,
    signTx,
    signTxLegacy,
    verifyTx,
    verifyTicketTx,
} from './bitcoin';
import type { BitcoinNetworkInfo, AccountAddresses } from '../types';
import type { RefTransaction, TransactionOptions } from '../types/api/signTransaction';

type Params = {
    inputs: PROTO.TxInputType[];
    outputs: PROTO.TxOutputType[];
    paymentRequests: PROTO.TxAckPaymentRequest[];
    refTxs?: RefTransaction[];
    addresses?: AccountAddresses;
    options: TransactionOptions;
    coinInfo: BitcoinNetworkInfo;
    push: boolean;
    preauthorized?: boolean;
};

export default class SignTransaction extends AbstractMethod<'signTransaction', Params> {
    init() {
        this.requiredPermissions = ['read', 'write'];
        this.info = 'Sign transaction';

        const { payload } = this;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'coin', type: 'string', required: true },
            { name: 'inputs', type: 'array', required: true },
            { name: 'outputs', type: 'array', required: true },
            { name: 'paymentRequests', type: 'array', allowEmpty: true },
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
        ]);

        const coinInfo = getBitcoinNetwork(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // set required firmware from coinInfo support
        this.firmwareRange = getFirmwareRange(this.name, coinInfo, this.firmwareRange);
        this.info = getLabel('Sign #NETWORK transaction', coinInfo);

        const inputs = validateTrezorInputs(payload.inputs, coinInfo);
        const outputs = validateTrezorOutputs(payload.outputs, coinInfo);
        const refTxs = validateReferencedTransactions(payload.refTxs, inputs, outputs);

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
            if (total.lte(coinInfo.dustLimit)) {
                throw ERRORS.TypedError(
                    'Method_InvalidParameter',
                    'Total amount is below dust limit.',
                );
            }
        }

        this.params = {
            inputs,
            outputs: payload.outputs,
            paymentRequests: payload.paymentRequests || [],
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
            },
            coinInfo,
            push: typeof payload.push === 'boolean' ? payload.push : false,
            preauthorized: payload.preauthorized,
        };

        this.params.options = enhanceSignTx(this.params.options, coinInfo);
    }

    async run() {
        const { device, params } = this;

        let refTxs: RefTransaction[] = [];
        const useLegacySignProcess = device.unavailableCapabilities.replaceTransaction;
        if (!params.refTxs) {
            const requiredRefTxs = requireReferencedTransactions(
                params.inputs,
                params.options,
                params.coinInfo,
            );
            const refTxsIds = getReferencedTransactions(params.inputs);
            if (requiredRefTxs && refTxsIds.length > 0) {
                // validate and initialize backend
                isBackendSupported(params.coinInfo);
                const blockchain = await initBlockchain(params.coinInfo, this.postMessage);
                const rawTxs = await blockchain.getTransactions(refTxsIds);
                enhanceTrezorInputs(this.params.inputs, rawTxs);
                refTxs = transformReferencedTransactions(rawTxs, params.coinInfo);

                const origTxsIds = getOrigTransactions(params.inputs, params.outputs);
                if (!useLegacySignProcess && origTxsIds.length > 0) {
                    const rawOrigTxs = await blockchain.getTransactions(origTxsIds);
                    let { addresses } = params;
                    // sender account addresses not provided
                    // fetch account info from the blockbook
                    if (!addresses) {
                        // TODO: validate inputs address_n's === same account
                        const accountPath = params.inputs.find(i => i.address_n);
                        if (!accountPath || !accountPath.address_n) {
                            throw ERRORS.TypedError('Runtime', 'Account not found');
                        }
                        const node = await device
                            .getCommands()
                            .getHDNode(accountPath.address_n.slice(0, 3), params.coinInfo);
                        const account = await blockchain.getAccountInfo({
                            descriptor: node.xpubSegwit || node.xpub,
                            details: 'tokens',
                        });
                        addresses = account.addresses;
                    }
                    const origRefTxs = transformOrigTransactions(
                        rawOrigTxs,
                        params.coinInfo,
                        addresses,
                    );
                    refTxs = refTxs.concat(origRefTxs);
                }
            }
        } else {
            refTxs = params.refTxs;
        }

        if (params.preauthorized) {
            await device.getCommands().typedCall('DoPreauthorized', 'PreauthorizedRequest', {});
        }

        const signTxMethod = !useLegacySignProcess ? signTx : signTxLegacy;
        const response = await signTxMethod({
            ...params,
            refTxs,
            typedCall: device.getCommands().typedCall.bind(device.getCommands()),
        });

        if (params.options.decred_staking_ticket) {
            await verifyTicketTx(
                device.getCommands().getHDNode.bind(device.getCommands()),
                params.inputs,
                params.outputs,
                response.serializedTx,
                params.coinInfo,
            );
        } else {
            const bitcoinTx = await verifyTx(
                device.getCommands().getHDNode.bind(device.getCommands()),
                params.inputs,
                params.outputs,
                response.serializedTx,
                params.coinInfo,
            );

            if (bitcoinTx.hasWitnesses()) {
                response.witnesses = bitcoinTx.ins.map((_, i) =>
                    bitcoinTx.getWitness(i)?.toString('hex'),
                );
            }
        }

        if (params.push) {
            // validate backend
            isBackendSupported(params.coinInfo);
            const blockchain = await initBlockchain(params.coinInfo, this.postMessage);
            const txid = await blockchain.pushTransaction(response.serializedTx);
            return {
                ...response,
                txid,
            };
        }

        return response;
    }
}
