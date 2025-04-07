// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EthereumSignTransaction.js

import { MessagesSchema } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';
import { BigNumber } from '@trezor/utils';

import { AbstractMethod } from '../../../core/AbstractMethod';
import { getEthereumNetwork } from '../../../data/coinInfo';
import {
    EthereumNetworkInfoDefinitionValues,
    EthereumSignTransaction as EthereumSignTransactionSchema,
    TokenInfo,
} from '../../../types';
import type { EthereumTransaction, EthereumTransactionEIP1559 } from '../../../types/api/ethereum';
import { getNetworkLabel } from '../../../utils/ethereumUtils';
import { deepTransform, stripHexPrefix } from '../../../utils/formatUtils';
import { getSlip44ByPath, validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';
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
    init() {
        this.requiredPermissions = ['read', 'write'];
        this.requiredDeviceCapabilities = ['Capability_Ethereum'];

        const { payload } = this;
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

        // get firmware range depending on used transaction type
        // eip1559 is possible since 2.4.2
        this.firmwareRange = getFirmwareRange(
            isEIP1559 ? 'eip1559' : this.name,
            network,
            this.firmwareRange,
        );

        if (isEIP1559) {
            this.params = { path, network, type: 'eip1559', tx: strip(tx), chunkify };
        } else {
            this.params = { path, network, type: 'legacy', tx: strip(tx), chunkify };
        }

        // Since FW 2.4.3+ chainId will be required
        // TODO: this should be removed after next major/minor version (or after few months)
        // TODO: add "required: true" to chainId validation
        if (typeof tx.chainId !== 'number') {
            console.warn('TrezorConnect.ethereumSignTransaction: Missing chainId parameter!');
        }
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

    async payloadToPrecomposed() {
        const feePerByte = new BigNumber(
            this.payload.transaction.gasPrice || this.payload.transaction.maxFeePerGas!,
        );
        const fee = feePerByte.multipliedBy(this.payload.transaction.gasLimit);
        const data = this.payload.transaction.data?.replace(/^0x/, '');
        let recipient = this.payload.transaction.to!;
        let amount = new BigNumber(this.payload.transaction.value);
        let totalSpent = amount.plus(fee);
        let token: TokenInfo | undefined;

        // ERC-20 transfer
        // TODO: consider refactoring to shared util package together with `suite-common/wallet-constants/src/sendForm.ts`
        if (this.payload.transaction.to && data?.startsWith('a9059cbb') && amount.eq(0)) {
            const definitions = await getEthereumDefinitions({
                chainId: this.payload.transaction.chainId,
                contractAddress: this.payload.transaction.to.replace(/^0x/, ''),
            });
            const decoded = decodeEthereumDefinition(definitions);
            if (decoded.token) {
                recipient = '0x' + data.slice(32, 72);
                amount = new BigNumber(data.slice(72, 136), 16);
                totalSpent = amount;
                token = {
                    ...decoded.token,
                    type: 'ERC20',
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
            maxFeePerGas: this.payload.transaction.maxFeePerGas
                ? new BigNumber(this.payload.transaction.maxFeePerGas)
                      .dividedBy(1e9) // wei to Gwei
                      .toString()
                : undefined,
            maxPriorityFeePerGas: this.payload.transaction.maxPriorityFeePerGas
                ? new BigNumber(this.payload.transaction.maxPriorityFeePerGas)
                      .dividedBy(1e9) // wei to Gwei
                      .toString()
                : undefined,
            feeLimit: new BigNumber(this.payload.transaction.gasLimit).toString(),
            bytes: 0,
            max: undefined,
            isTokenKnown: !!token,
            token,
        };
    }

    async run() {
        const { type, tx, definitions, chunkify } = this.params;

        const isLegacy = type === 'legacy';

        const signature = isLegacy
            ? await helper.ethereumSignTx(
                  this.device.getCommands().typedCall,
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
              )
            : await helper.ethereumSignTxEIP1559(
                  this.device.getCommands().typedCall,
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
              );

        const serializedTx = helper.serializeEthereumTx(tx, signature, isLegacy);

        return { ...signature, serializedTx };
    }
}
