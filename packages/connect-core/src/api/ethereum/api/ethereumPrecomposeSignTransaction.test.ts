import fetch from 'cross-fetch';

import type { EthereumSignTransaction } from '@trezor/connect-common';

import EthereumPrecomposeSignTransaction from './ethereumPrecomposeSignTransaction';

jest.mock('cross-fetch');

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

const precompose = (transaction: EthereumSignTransaction['transaction']) =>
    new EthereumPrecomposeSignTransaction({
        payload: {
            method: 'ethereumPrecomposeSignTransaction',
            path: "m/44'/60'/0'/0/0",
            transaction,
        },
    }).run();

describe('EthereumPrecomposeSignTransaction', () => {
    beforeEach(() => {
        mockedFetch.mockReset();
        mockedFetch.mockResolvedValue({ status: 404 } as Response);
    });

    it('precomposes an ether transfer without downloading definitions', async () => {
        await expect(
            precompose({
                to: '0x7314e0f1c0e28474bdb6be3e2c3e0453255188f8',
                value: '0x0de0b6b3a7640000',
                gasPrice: '0x3b9aca00',
                gasLimit: '0x5208',
                nonce: '0x0',
                chainId: 1,
            }),
        ).resolves.toMatchObject({
            outputs: [
                {
                    address: '0x7314e0f1c0e28474bdb6be3e2c3e0453255188f8',
                    amount: '1000000000000000000',
                },
            ],
            fee: '21000000000000',
            feePerByte: '1',
            totalSpent: '1000021000000000000',
            nativeToken: { symbol: 'ETH' },
        });
        expect(mockedFetch).not.toHaveBeenCalled();
    });
});
