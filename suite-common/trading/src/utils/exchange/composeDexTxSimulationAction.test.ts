import { type CryptoId, type ExchangeTrade } from 'invity-api';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { composeDexTxSimulationAction } from './composeDexTxSimulationAction';

const SOURCE_ORIGIN = 'https://example.com';
const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });

const typedData = {
    primaryType: 'Order',
    types: {
        EIP712Domain: [{ name: 'name', type: 'string' }],
        Order: [{ name: 'salt', type: 'uint256' }],
    },
    domain: { name: '1inch Aggregation Router' },
    message: { salt: '1' },
};

const quote: ExchangeTrade = {
    send: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
    sendStringAmount: '10',
    receive: 'ethereum' as CryptoId,
    receiveStringAmount: '0.004',
    rate: 0.0004,
    min: 0,
    max: 'NONE',
    fee: 'UNKNOWN',
    exchange: '1inchfusion',
    isDex: true,
    status: 'CONFIRM',
    dexTx: {
        from: account.descriptor,
        to: '0x111111125421ca6dc452d289314280a0f8842a65',
        data: '',
        value: '0',
    },
    signData: { type: 'eip712-typed-data', data: typedData },
};

describe('composeDexTxSimulationAction', () => {
    it('simulates the EIP-712 order of a CONFIRM quote instead of its placeholder transaction', () => {
        const action = composeDexTxSimulationAction({
            quote,
            account,
            sourceOrigin: SOURCE_ORIGIN,
        });

        expect(action).toEqual({
            method: 'ethereumSignTypedData',
            fromAddress: account.descriptor,
            sourceOrigin: SOURCE_ORIGIN,
            payload: { path: account.path, metamask_v4_compat: true, data: typedData },
        });
    });
});
