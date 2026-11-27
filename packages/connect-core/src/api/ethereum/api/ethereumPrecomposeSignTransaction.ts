import type { TokenInfo } from '@trezor/connect-common';
import { EthereumSignTransaction as EthereumSignTransactionSchema } from '@trezor/connect-common';
import { Assert } from '@trezor/schema-utils';
import { BigNumber } from '@trezor/utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getEthereumNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import {
    decodeEthereumDefinition,
    ethereumNetworkInfoFromDefinition,
    getEthereumTransactionDefinitions,
} from '../ethereumDefinitions';

type Params = Pick<EthereumSignTransactionSchema, 'transaction'> & { path: number[] };

export default class EthereumPrecomposeSignTransaction extends AbstractMethod<
    'ethereumPrecomposeSignTransaction',
    Params
> {
    constructor(message: MethodMessage<'ethereumPrecomposeSignTransaction'>) {
        const { payload } = message;

        Assert(EthereumSignTransactionSchema, payload);

        super(message, { path: validatePath(payload.path, 3), transaction: payload.transaction });
        this.useDevice = false;
    }

    async run() {
        const { path, transaction } = this.params;
        // The definitions name the network of the chain and the token of an ERC-20 transfer.
        const definitions = await getEthereumTransactionDefinitions({ path, transaction });
        const decoded = definitions && decodeEthereumDefinition(definitions);
        const network = decoded?.network
            ? ethereumNetworkInfoFromDefinition(decoded.network)
            : getEthereumNetwork(path);

        const feePerByte = new BigNumber(transaction.gasPrice || transaction.maxFeePerGas!);
        const fee = feePerByte.multipliedBy(transaction.gasLimit);
        const { data } = transaction;
        let recipient = transaction.to!;
        let amount = new BigNumber(transaction.value);
        let totalSpent = amount.plus(fee);
        let token: TokenInfo | undefined;

        // ERC-20 transfer
        // TODO: consider refactoring to shared util package together with `suite-common/wallet-constants/src/sendForm.ts`
        if (transaction.to && data?.startsWith('a9059cbb') && amount.eq(0) && decoded?.token) {
            recipient = '0x' + data.slice(32, 72);
            amount = new BigNumber(data.slice(72, 136), 16);
            totalSpent = amount;
            token = {
                ...decoded.token,
                standard: 'ERC20',
                contract: decoded.token.address,
            };
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
            nativeToken: network
                ? {
                      type: 'NATIVE',
                      standard: 'NATIVE',
                      contract: '',
                      name: network.name,
                      symbol: network.shortcut,
                      decimals: network.decimals,
                  }
                : undefined,
            network,
        };
    }
}
