import type { ERRORS, GetTrezorConnectDep } from '@trezor/connect-common';
import {
    ChainSendError,
    type ChainSignedTransaction,
    type SignChainTransactionParams,
    toCoinSymbol,
} from '@trezor/network-module-suite-common-types';
import * as tronUtils from '@trezor/network-tron/utils';
import { BigNumber } from '@trezor/utils';

import { buildTransferContract, buildTriggerContract } from './buildContract';
import { resolveCalldata } from './resolveCalldata';
import type { TronSendConfig } from './types';

export type SignTronTransactionDeps = GetTrezorConnectDep<
    'blockchainGetInfo' | 'tronComposeTransaction' | 'tronSignTransaction'
>;

export type SignTronTransactionParams = SignChainTransactionParams & { config: TronSendConfig };

export type SignTronTransaction = (
    params: SignTronTransactionParams,
) => Promise<ChainSignedTransaction>;

/** Builds the transaction on the latest block and signs it on the device. */
export const createSignTronTransaction =
    (deps: SignTronTransactionDeps): SignTronTransaction =>
    async ({ account, draft, precomposed, options, config }) => {
        const { symbol } = account;
        const fail = (message: string, connectErrorCode?: ERRORS.ErrorCode) =>
            new ChainSendError('sign-failed', symbol, message, connectErrorCode);
        const connect = deps.getTrezorConnect();

        const blockchainInfo = await connect.blockchainGetInfo({
            coin: toCoinSymbol(symbol),
            identity: account.deviceState,
        });
        if (!blockchainInfo.success) {
            throw fail('Failed to fetch blockchain info.');
        }

        const { blockHash, blockHeight } = blockchainInfo.payload;
        const { token } = precomposed;
        const [output] = draft.outputs;

        if (!output) {
            throw fail('Missing transaction output.');
        }

        const amountInSubunits = new BigNumber(output.amount)
            .shiftedBy(token ? token.decimals : config.decimals)
            .toString();

        const userCallDataHex = draft.transactionData
            ? draft.transactionData.replace(/^0x/, '')
            : '';

        const feeLimitSource = draft.feeLimit || precomposed.fee;
        const feeLimitSun =
            (token || userCallDataHex) && feeLimitSource ? Number(feeLimitSource) : undefined;

        const ownerHex = tronUtils.tronAddressToHex(account.descriptor);
        const recipientHex = token
            ? tronUtils.tronAddressToHex(token.contract)
            : tronUtils.tronAddressToHex(output.address);

        if (!ownerHex || !recipientHex) {
            throw fail('Invalid address checksum.');
        }

        const calldata = resolveCalldata({
            token,
            outputAddress: output.address,
            amountInSubunits,
            userCallDataHex,
        });

        if ('error' in calldata) {
            throw fail(calldata.error);
        }

        const contract =
            calldata.data !== null
                ? buildTriggerContract({ ownerHex, recipientHex, data: calldata.data })
                : buildTransferContract({ ownerHex, recipientHex, amount: amountInSubunits });

        const noteHex = draft.destinationTag
            ? Buffer.from(draft.destinationTag, 'utf8').toString('hex')
            : undefined;

        const composed = await connect.tronComposeTransaction({
            contract,
            blockHash,
            blockHeight,
            fee_limit: feeLimitSun,
            data: noteHex || undefined,
        });

        if (!composed.success) {
            throw fail(composed.error.message, composed.error.code);
        }

        const { ref_block_bytes, ref_block_hash, expiration, timestamp } = composed.payload;

        const signed = await connect.tronSignTransaction({
            device: options.device,
            path: account.path,
            ref_block_bytes,
            ref_block_hash,
            expiration,
            timestamp,
            fee_limit: feeLimitSun,
            data: noteHex || undefined,
            contract: [contract],
        });

        if (!signed.success) {
            throw fail(signed.error.message, signed.error.code);
        }

        if (!signed.payload.serializedTx) {
            throw fail('Failed to serialize transaction.');
        }

        return { serializedTx: signed.payload.serializedTx };
    };
