import { createSolanaRpcFromTransport, getAddressDecoder, isJsonRpcPayload } from '@solana/kit';
import type { RpcTransport } from '@solana/kit';

import type { PrepareStakeSolTxResponse } from '../types';
import {
    getSolanaValidatorFixtures,
    mockNow,
    mockSender,
    mockStakeAccount,
    stakeTransactionFixtures,
} from './__fixtures__/staking.fixture';
import {
    prepareClaimSolTx,
    prepareStakeSolTx,
    prepareUnstakeSolTx,
    selectSolanaValidator,
    unstake,
} from './staking';

const mockConnection = (rpcResults: Record<string, unknown>) => {
    const transport: RpcTransport = <TResponse>({ payload }: Parameters<RpcTransport>[0]) => {
        if (!isJsonRpcPayload(payload) || !(payload.method in rpcResults)) {
            return Promise.reject(new Error('Unexpected RPC request'));
        }

        return Promise.resolve({
            jsonrpc: '2.0',
            result: rpcResults[payload.method],
        } as TResponse);
    };

    return createSolanaRpcFromTransport(transport);
};

const getSerializedMessage = (response: PrepareStakeSolTxResponse) =>
    response.success ? response.txShim.serializeMessage() : response.errorMessage;

describe('selectSolanaValidator', () => {
    getSolanaValidatorFixtures.forEach(fixture => {
        it(fixture.description, () => {
            const result = selectSolanaValidator(fixture.symbol);
            expect(result).toBe(fixture.result);
        });
    });
});

describe('stake account layout', () => {
    const validator = selectSolanaValidator('dsol');

    beforeEach(() => {
        jest.useFakeTimers({ now: mockNow });
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it.each([1, 15, 16, 17])('rejects an invalid split across %s active accounts', async count => {
        const getProgramAccounts = Array.from({ length: count }, (_, index) =>
            mockStakeAccount({
                pubkey: getAddressDecoder().decode(new Uint8Array(32).fill(index + 3)),
                stake: 2_000_000_000,
                deactivationEpoch: 18_446_744_073_709_551_615n,
            }),
        );
        const connection = mockConnection({
            ...stakeTransactionFixtures.unstakeWithSplit.rpcResults,
            getProgramAccounts,
        });

        for (const lamports of [500_000_000n, 1_500_000_000n]) {
            await expect(
                unstake({ connection, sender: mockSender, lamports, source: '1' }),
            ).rejects.toThrow('Unstake amount cannot be split');
        }

        const split = await unstake({
            connection,
            sender: mockSender,
            lamports: 1_000_000_000n,
            source: '1',
        });
        expect(split.unstakeAmount).toBe(1_000_000_000n);
        const full = await unstake({
            connection,
            sender: mockSender,
            lamports: BigInt(count) * 2_000_000_000n,
            source: '1',
        });
        expect(full.unstakeAmount).toBe(BigInt(Math.min(count, 16)) * 2_000_000_000n);
    });

    it('builds stake transaction with sysvar and config accounts', async () => {
        const { rpcResults, message } = stakeTransactionFixtures.stake;

        const response = await prepareStakeSolTx({
            from: mockSender,
            amount: '1',
            connection: mockConnection(rpcResults),
            validator,
        });

        expect(getSerializedMessage(response)).toBe(message);
    });

    it('builds unstake transaction with clock sysvar account', async () => {
        const { rpcResults, message } = stakeTransactionFixtures.unstake;

        const response = await prepareUnstakeSolTx({
            from: mockSender,
            amount: '7',
            connection: mockConnection(rpcResults),
            validator,
        });

        expect(getSerializedMessage(response)).toBe(message);
    });

    it('unstakes only from Everstake stake accounts', async () => {
        const { rpcResults } = stakeTransactionFixtures.unstakeIgnoringOtherValidators;

        const response = await prepareUnstakeSolTx({
            from: mockSender,
            amount: '7',
            connection: mockConnection(rpcResults),
            validator,
        });

        expect(getSerializedMessage(response)).toBe(stakeTransactionFixtures.unstake.message);
    });

    it('reports an unstake above the active stake as insufficient active stake', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        const { rpcResults } = stakeTransactionFixtures.unstake;

        const response = await prepareUnstakeSolTx({
            from: mockSender,
            amount: '1000',
            connection: mockConnection(rpcResults),
            validator,
        });

        expect(response).toEqual({
            success: false,
            errorCode: 'INSUFFICIENT_ACTIVE_STAKE',
            errorMessage: expect.stringContaining('Active stake less than requested'),
        });
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('reports any other unstake failure as unknown', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});

        const response = await prepareUnstakeSolTx({
            from: mockSender,
            amount: '7',
            connection: mockConnection({}),
            validator,
        });

        expect(response).toEqual({
            success: false,
            errorCode: 'UNKNOWN',
            errorMessage: expect.stringContaining('Failed to fetch delegations'),
        });
    });

    it('builds split unstake transaction with clock sysvar account', async () => {
        const { rpcResults, message } = stakeTransactionFixtures.unstakeWithSplit;

        const response = await prepareUnstakeSolTx({
            from: mockSender,
            amount: '2',
            connection: mockConnection(rpcResults),
            validator,
        });

        expect(getSerializedMessage(response)).toBe(message);
    });

    it('builds claim transaction with sysvar accounts', async () => {
        const { rpcResults, message } = stakeTransactionFixtures.claim;

        const response = await prepareClaimSolTx({
            from: mockSender,
            connection: mockConnection(rpcResults),
        });

        expect(getSerializedMessage(response)).toBe(message);
    });

    it('returns a recoverable invalid-fee result for every staking operation', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const estimatedFee = { feePerUnit: 'NaN', feeLimit: '200000' };
        const params = { from: mockSender, connection: mockConnection({}), estimatedFee };

        try {
            const responses = await Promise.all([
                prepareStakeSolTx({ ...params, amount: '1', validator }),
                prepareUnstakeSolTx({ ...params, amount: '1', validator }),
                prepareClaimSolTx(params),
            ]);

            for (const response of responses) {
                expect(response).toEqual({
                    success: false,
                    errorCode: 'INVALID_FEE',
                    errorMessage: 'Invalid Solana staking fee estimate.',
                });
            }
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });
});
