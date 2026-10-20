import { encodeAbiParameters, parseAbiParameters } from 'viem';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import TrezorConnect from '@trezor/connect';

import { fetchAllowance } from './fetchAllowance';

const TOKEN = '0x1111111111111111111111111111111111111111';
const OWNER = '0x3333333333333333333333333333333333333333';
const SPENDER = '0x4444444444444444444444444444444444444444';

const rpcCallMock = jest.spyOn(TrezorConnect, 'blockchainEvmRpcCall');

beforeEach(() => {
    jest.clearAllMocks();
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe(fetchAllowance.name, () => {
    it('reads the allowance of the spender as a subunit amount', async () => {
        rpcCallMock.mockResolvedValue({
            success: true,
            payload: { data: encodeAbiParameters(parseAbiParameters('uint256'), [1500n]) },
        } as never);

        const allowance = await fetchAllowance({
            owner: OWNER,
            spender: SPENDER,
            tokenContractAddress: TOKEN,
            coin: asNetworkSymbol('eth'),
        });

        expect(allowance.toString()).toBe('1500');
        expect(rpcCallMock.mock.calls[0]?.[0]).toMatchObject({
            coin: 'eth',
            from: OWNER,
            to: TOKEN,
        });
    });

    it('fails with the error name only when the read fails', async () => {
        rpcCallMock.mockResolvedValue({
            success: false,
            error: { code: 'Method_Unknown', message: 'secret details' },
        } as never);

        await expect(
            fetchAllowance({
                owner: OWNER,
                spender: SPENDER,
                tokenContractAddress: TOKEN,
                coin: asNetworkSymbol('eth'),
            }),
        ).rejects.toThrow('Allowance read failed: Method_Unknown');
    });

    it('rejects an invalid token contract address before reading', async () => {
        await expect(
            fetchAllowance({
                owner: OWNER,
                spender: SPENDER,
                tokenContractAddress: 'not-an-address',
                coin: asNetworkSymbol('eth'),
            }),
        ).rejects.toThrow('invalid');
        expect(rpcCallMock).not.toHaveBeenCalled();
    });
});
