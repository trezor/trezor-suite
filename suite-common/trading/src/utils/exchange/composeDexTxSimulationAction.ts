import { type ExchangeTrade } from 'invity-api';

import { getNetwork } from '@suite-common/wallet-config';
import { type Account, type TxSimulationAction } from '@suite-common/wallet-types';
import { fromEther } from '@suite-common/wallet-utils';
import {
    type EthereumSignTypedDataMessage,
    type EthereumSignTypedDataTypes,
} from '@trezor/connect';

import { hasEip712SignData } from './exchangeUtils';

type ComposeDexTxSimulationActionParams = {
    quote: ExchangeTrade | undefined;
    account: Account | undefined;
    sourceOrigin: string;
};

export const composeDexTxSimulationAction = ({
    quote,
    account,
    sourceOrigin,
}: ComposeDexTxSimulationActionParams): TxSimulationAction | null => {
    if (!quote?.isDex || !account) {
        return null;
    }

    const network = getNetwork(account.symbol);

    if (network.networkType !== 'ethereum' || network.chainId === undefined) {
        return null;
    }

    if (hasEip712SignData(quote) && quote.signData) {
        return {
            method: 'ethereumSignTypedData',
            fromAddress: account.descriptor,
            sourceOrigin,
            payload: {
                path: account.path,
                metamask_v4_compat: true,
                data: quote.signData
                    .data as EthereumSignTypedDataMessage<EthereumSignTypedDataTypes>,
            },
        };
    }

    if (!quote.dexTx) {
        return null;
    }

    try {
        return {
            method: 'ethereumSignTransaction',
            fromAddress: quote.dexTx.from,
            sourceOrigin,
            payload: {
                path: account.path,
                transaction: {
                    to: quote.dexTx.to,
                    value: fromEther(quote.dexTx.value).toWei('hex'),
                    data: quote.dexTx.data,
                    chainId: network.chainId,
                    // Placeholders — the simulation only reads to/value/data/chainId.
                    nonce: '0',
                    gasLimit: '0x0',
                    maxFeePerGas: '0x0',
                    maxPriorityFeePerGas: '0x0',
                },
            },
        };
    } catch (error) {
        console.error('Failed to compose DEX tx simulation action', error);

        return null;
    }
};
