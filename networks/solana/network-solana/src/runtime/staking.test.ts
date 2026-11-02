import { createSolanaRpcFromTransport, isJsonRpcPayload } from '@solana/kit';
import type { RpcTransport } from '@solana/kit';

import type { PrepareStakeSolTxResponse } from '../types';
import {
    getSolanaValidatorFixtures,
    mockNow,
    mockSender,
    stakeTransactionFixtures,
} from './__fixtures__/staking.fixture';
import {
    prepareClaimSolTx,
    prepareStakeSolTx,
    prepareUnstakeSolTx,
    selectSolanaValidator,
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
});
