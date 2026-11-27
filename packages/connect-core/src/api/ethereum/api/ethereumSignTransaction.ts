// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EthereumSignTransaction.js

import { getAddress, isAddress } from 'viem';

import {
    EthereumSignTransaction as EthereumSignTransactionSchema,
    ExperimentalMethod,
} from '@trezor/connect-common';
import type { EthereumTransaction, EthereumTransactionEIP1559 } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import type { MessagesSchema } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getEthereumNetwork } from '../../../data/coinInfo';
import { getDefinitionsVersion } from '../../../utils/definitionsUtils';
import { addHexPrefix, deepTransform, stripHexPrefix } from '../../../utils/formatUtils';
import { validatePath } from '../../../utils/pathUtils';
import {
    PAYMENT_REQUEST_AMOUNT_BYTES,
    encodePaymentRequestAmount,
} from '../../../utils/paymentRequest';
import { getEthereumTransactionDefinitions } from '../ethereumDefinitions';
import * as helper from '../ethereumSignTx';

type Params = {
    path: number[];
    chunkify: boolean;
    auth7702?: MessagesSchema.EthereumSignTxEIP1559['auth7702'];
} & (
    | {
          type: 'legacy';
          tx: EthereumTransaction;
      }
    | {
          type: 'eip1559';
          tx: EthereumTransactionEIP1559;
      }
);

// Delegating an account is expensive to get wrong, so a mixed-case address has to carry a valid
// EIP-55 checksum; an all-lowercase address is accepted as-is. The device renders `delegate`
// exactly as it was received, hence the normalization to the checksummed form.
const normalizeDelegate = (delegate: string) => {
    if (!isAddress(delegate, { strict: true })) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            'EIP-7702 authorization "address" is not a valid Ethereum address.',
        );
    }

    return getAddress(delegate);
};

const strip = deepTransform(value => {
    let stripped = stripHexPrefix(value);
    // pad left even
    if (stripped.length % 2 !== 0) {
        stripped = `0${stripped}`;
    }

    return stripped;
});

export default class EthereumSignTransaction extends AbstractMethod<
    'ethereumSignTransaction',
    Params
> {
    constructor(message: MethodMessage<'ethereumSignTransaction'>) {
        const { payload } = message;
        // validate incoming parameters
        Assert(EthereumSignTransactionSchema, payload);

        const path = validatePath(payload.path, 3);
        const network = getEthereumNetwork(path);
        const chunkify = typeof payload.chunkify === 'boolean' ? payload.chunkify : false;

        // incoming transaction should be in EthereumTx format
        // https://github.com/ethereumjs/ethereumjs-tx
        const tx = payload.transaction;
        const isEIP1559 =
            typeof tx.maxFeePerGas === 'string' && typeof tx.maxPriorityFeePerGas === 'string';

        // EIP-7702 authorizations are experimental and attach to a type-4 (set-code) transaction,
        // which is an EIP-1559 transaction with an authorization list. Firmware signs at most one.
        const authorizationList = 'authorizationList' in tx ? tx.authorizationList : undefined;
        // The schema enforces a single entry (and rejects an empty list), so at most one reaches here.
        const [authorization] = authorizationList ?? [];
        let auth7702: MessagesSchema.EthereumSignTxEIP1559['auth7702'];
        if (authorization) {
            Assert(ExperimentalMethod, payload);
            if (!isEIP1559) {
                throw ERRORS.TypedError(
                    'Method_InvalidParameter',
                    'EIP-7702 "authorizationList" requires an EIP-1559 transaction.',
                );
            }
            // The device echoes `chainId` and derives the authorization `nonce` as tx `nonce + 1`,
            // both parsed back through Number. Reject values JavaScript cannot represent exactly so a
            // rounded nonce/chainId can never desync the signed authorization from its serialization.
            const authNonce = (tx.nonce ? BigInt(addHexPrefix(tx.nonce)) : 0n) + 1n;
            if (authNonce > BigInt(Number.MAX_SAFE_INTEGER) || !Number.isSafeInteger(tx.chainId)) {
                throw ERRORS.TypedError(
                    'Method_InvalidParameter',
                    'EIP-7702 authorization chainId/nonce exceed the safe integer range.',
                );
            }
            auth7702 = { delegate: normalizeDelegate(authorization.address) };
        }

        // The authorization list is handled separately: its delegate address must reach the device
        // with its original casing, so it is excluded from the hex-stripping applied to the rest.
        const { authorizationList: _authorizationList, ...txToStrip } =
            tx as EthereumTransactionEIP1559;

        const params = {
            path,
            type: isEIP1559 ? 'eip1559' : 'legacy',
            tx: {
                ...strip(txToStrip),
                payment_req: tx.payment_req
                    ? encodePaymentRequestAmount(tx.payment_req, PAYMENT_REQUEST_AMOUNT_BYTES.EVM)
                    : undefined,
            },
            chunkify,
            auth7702,
        } as Params;

        // Since FW 2.4.3+ chainId will be required
        // TODO: this should be removed after next major/minor version (or after few months)
        // TODO: add "required: true" to chainId validation
        if (typeof tx.chainId !== 'number') {
            console.warn('TrezorConnect.ethereumSignTransaction: Missing chainId parameter!');
        }

        super(message, params);

        this.requiredFirmwareCoins = [network];
        this.requiredDeviceCapabilities = ['Capability_Ethereum'];
        // get firmware range depending on used transaction type
        // eip1559 is possible since 2.4.2
        if (isEIP1559) {
            this.requiredFirmwareCapabilities = ['eip1559'];
            // EIP-7702 (type-4) needs Core 2.12.5+; gate it up front so old/T1B1 firmware that would
            // silently ignore auth7702 and sign a plain EIP-1559 transaction is rejected before signing.
            if (auth7702) {
                this.requiredFirmwareCapabilities.push('eip7702');
            }
        }
    }

    async run() {
        const { type, tx, chunkify, auth7702 } = this.params;
        const definitionsVersion = getDefinitionsVersion(this.getDevice());
        const definitions = await getEthereumTransactionDefinitions({
            path: this.params.path,
            transaction: tx,
            version: definitionsVersion,
        });

        const isLegacy = type === 'legacy';

        const signature = isLegacy
            ? await helper.ethereumSignTx(
                  this.getDevice().getCommands().typedCall,
                  definitionsVersion,
                  this.params.path,
                  tx.to,
                  tx.value,
                  tx.gasLimit,
                  tx.gasPrice,
                  tx.nonce,
                  tx.chainId,
                  chunkify,
                  tx.data,
                  tx.txType,
                  definitions,
                  tx.payment_req,
              )
            : await helper.ethereumSignTxEIP1559(
                  this.getDevice().getCommands().typedCall,
                  definitionsVersion,
                  this.params.path,
                  tx.to,
                  tx.value,
                  tx.gasLimit,
                  tx.maxFeePerGas,
                  tx.maxPriorityFeePerGas,
                  tx.nonce,
                  tx.chainId,
                  chunkify,
                  tx.data,
                  tx.accessList,
                  definitions,
                  tx.payment_req,
                  auth7702,
              );

        const { authorizationList } = signature;

        // Guard against older firmware that ignores the experimental `auth7702` field and would
        // otherwise return a plain signature that cannot be serialized into a type-4 transaction.
        if (auth7702 && (!authorizationList || authorizationList.length === 0)) {
            throw ERRORS.TypedError(
                'Runtime',
                'Device did not return an EIP-7702 authorization. Update the firmware to sign EIP-7702 transactions.',
            );
        }

        const serializedTx = helper.serializeEthereumTx(tx, signature, isLegacy, authorizationList);

        return { ...signature, serializedTx };
    }
}
