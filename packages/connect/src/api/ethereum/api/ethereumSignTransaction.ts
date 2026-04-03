// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EthereumSignTransaction.js

import { EthereumSignTransaction as EthereumSignTransactionSchema } from '@trezor/connect-common';
import type {
    EthereumNetworkInfoDefinitionValues,
    EthereumTransaction,
    EthereumTransactionEIP1559,
    TokenInfo,
} from '@trezor/connect-common';
import type { MessagesSchema } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';
import { BigNumber } from '@trezor/utils';

import type { MethodMessage, MethodPermission } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getEthereumNetwork } from '../../../data/coinInfo';
import { getNetworkLabel } from '../../../utils/ethereumUtils';
import { deepTransform, stripHexPrefix } from '../../../utils/formatUtils';
import { getSlip44ByPath, validatePath } from '../../../utils/pathUtils';
import {
    decodeEthereumDefinition,
    ethereumNetworkInfoFromDefinition,
    getEthereumDefinitions,
} from '../ethereumDefinitions';
import * as helper from '../ethereumSignTx';

type Params = {
    path: number[];
    network?: EthereumNetworkInfoDefinitionValues;
    definitions?: MessagesSchema.EthereumDefinitions;
    chunkify: boolean;
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

        const params = {
            path,
            network,
            type: isEIP1559 ? 'eip1559' : 'legacy',
            tx: {
                ...strip(tx),
                payment_req: tx.payment_req,
            },
            chunkify,
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
        }
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
    }

    async initAsync(): Promise<void> {
        // eth && token => yes
        // evm && token => yes
        // eth && !token => no
        // evm && !token => yes
        if (this.params.tx.chainId === 1 && !this.params.tx.data) {
            return;
        }
        const slip44 = getSlip44ByPath(this.params.path);
        const definitions = await getEthereumDefinitions({
            chainId: this.params.tx.chainId,
            slip44,
            contractAddress:
                this.params.tx.data && this.params.tx.to != null ? this.params.tx.to : undefined,
        });
        this.params.definitions = definitions;

        const decoded = decodeEthereumDefinition(definitions);
        if (decoded.network) {
            this.params.network = ethereumNetworkInfoFromDefinition(decoded.network);
        }
    }

    get info() {
        return getNetworkLabel('Sign #NETWORK transaction', this.params.network);
    }

    payloadToPrecomposed() {
        try {
            const transaction = this.params.tx;
            const feePerByte = new BigNumber(transaction.gasPrice || transaction.maxFeePerGas!);
            const fee = feePerByte.multipliedBy(transaction.gasLimit);
            const { data } = transaction;
            let recipient = transaction.to!;
            let amount = new BigNumber(transaction.value);
            let totalSpent = amount.plus(fee);
            let token: TokenInfo | undefined;

            // ERC-20 transfer
            // TODO: consider refactoring to shared util package together with `suite-common/wallet-constants/src/sendForm.ts`
            if (
                transaction.to &&
                data?.startsWith('a9059cbb') &&
                amount.eq(0) &&
                this.params.definitions
            ) {
                const decoded = decodeEthereumDefinition(this.params.definitions);
                if (decoded.token) {
                    recipient = '0x' + data.slice(32, 72);
                    amount = new BigNumber(data.slice(72, 136), 16);
                    totalSpent = amount;
                    token = {
                        ...decoded.token,
                        standard: 'ERC20',
                        contract: decoded.token.address,
                    };
                }
            }

            return {
                type: 'final' as const,
                inputs: [],
                outputsPermutation: [0],
                outputs: [
                    {
                        address: recipient,
                        amount: amount.toString(),
                        script_type: 'PAYTOADDRESS' as const,
                    },
                ],
                totalSpent: totalSpent.toString(),
                fee: fee.toString(),
                feePerByte: feePerByte
                    .dividedBy(1e9) // wei to Gwei
                    .toString(),
                maxFeePerGas: transaction.maxFeePerGas
                    ? new BigNumber(transaction.maxFeePerGas)
                          .dividedBy(1e9) // wei to Gwei
                          .toString()
                    : undefined,
                maxPriorityFeePerGas: transaction.maxPriorityFeePerGas
                    ? new BigNumber(transaction.maxPriorityFeePerGas)
                          .dividedBy(1e9) // wei to Gwei
                          .toString()
                    : undefined,
                feeLimit: new BigNumber(transaction.gasLimit).toString(),
                bytes: 0,
                max: undefined,
                isTokenKnown: !!token,
                token,
                nativeToken: this.params.network
                    ? {
                          type: 'NATIVE',
                          standard: 'NATIVE',
                          contract: '',
                          name: this.params.network.name,
                          symbol: this.params.network.shortcut,
                          decimals: this.params.network.decimals,
                      }
                    : undefined,
                network: this.params.network,
            };
        } catch (e) {
            // Don't throw errors from this method
            console.error('Error in payloadToPrecomposed', e);
        }
    }

    async run() {
        const { type, tx, definitions, chunkify } = this.params;

        const isLegacy = type === 'legacy';

        const signature = isLegacy
            ? await helper.ethereumSignTx(
                  this.getDevice().getCommands().typedCall,
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
              );

        const serializedTx = helper.serializeEthereumTx(tx, signature, isLegacy);

        return { ...signature, serializedTx };
    }
}
