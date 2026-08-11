import { useSelector } from 'react-redux';

import { useQuery } from '@suite-common/react-query';
import { type AccountWithNetworkType } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';

import { evmTx } from './__fixtures__/evmFixtures';
import { useEvmNonceInfo } from './useEvmNonceInfo';

// The hook uses only useMemo, useSelector and useQuery. Mocking those lets us call it directly and
// assert its logic (query config, queryFn, derived nonce info) without a renderer — the same
// approach as useMissingRateTickersQuery.test.ts.
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useMemo: (factory: () => unknown) => factory(),
}));

jest.mock('react-redux', () => ({
    __esModule: true,
    useSelector: jest.fn(),
}));

jest.mock('@suite-common/react-query', () => ({
    __esModule: true,
    ...jest.requireActual('@suite-common/react-query'),
    useQuery: jest.fn(),
}));

type EthAccount = AccountWithNetworkType<'ethereum'>;

// mockWalletAccount seeds ethereum accounts with misc.nonce = '6'.
const account = mockWalletAccount({ symbol: 'eth' }) as EthAccount;

const mockUseSelector = jest.mocked(useSelector);
const mockUseQuery = jest.mocked(useQuery);

type QueryConfig = {
    queryKey: unknown;
    queryFn: () => Promise<{ nonce: string; isTrusted: boolean }>;
    enabled: boolean;
};

const lastQueryConfig = () => {
    const { calls } = mockUseQuery.mock;

    return calls[calls.length - 1]?.[0] as unknown as QueryConfig;
};

describe('useEvmNonceInfo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseSelector.mockReturnValue([]);
        mockUseQuery.mockReturnValue({ data: undefined, isLoading: false } as any);
    });

    describe('query enablement', () => {
        it('enables the query for an ethereum account by default', () => {
            useEvmNonceInfo(account);

            expect(lastQueryConfig().enabled).toBe(true);
        });

        it('is disabled and returns no nonce info when the account is undefined', () => {
            const result = useEvmNonceInfo(undefined);

            expect(lastQueryConfig().enabled).toBe(false);
            expect(result).toEqual({ nonceInfo: undefined, isLoading: false });
        });

        it('is disabled when the caller passes enabled: false', () => {
            useEvmNonceInfo(account, { enabled: false });

            expect(lastQueryConfig().enabled).toBe(false);
        });
    });

    describe('nonce fetching (queryFn)', () => {
        afterEach(() => jest.restoreAllMocks());

        it('returns a trusted nonce from the backend confirmedNonce', async () => {
            const getAccountInfoSpy = jest
                .spyOn(TrezorConnect, 'getAccountInfo')
                .mockResolvedValue({
                    success: true,
                    payload: { misc: { confirmedNonce: '9' } },
                } as any);

            useEvmNonceInfo(account);
            const result = await lastQueryConfig().queryFn();

            expect(getAccountInfoSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    coin: account.symbol,
                    descriptor: account.descriptor,
                    confirmedNonce: true,
                }),
            );
            expect(result).toEqual({ nonce: '9', isTrusted: true });
        });

        it('falls back to the (untrusted) account nonce when the backend omits confirmedNonce', async () => {
            jest.spyOn(TrezorConnect, 'getAccountInfo').mockResolvedValue({
                success: true,
                payload: { misc: {} },
            } as any);

            useEvmNonceInfo(account);
            const result = await lastQueryConfig().queryFn();

            expect(result).toEqual({ nonce: account.misc.nonce, isTrusted: false });
        });

        it('throws when the backend request fails', async () => {
            jest.spyOn(TrezorConnect, 'getAccountInfo').mockResolvedValue({
                success: false,
                error: { message: 'backend down' },
            } as any);

            useEvmNonceInfo(account);

            await expect(lastQueryConfig().queryFn()).rejects.toThrow('backend down');
        });
    });

    describe('derived nonce info (useMemo)', () => {
        beforeEach(() => {
            // An own pending tx at a low nonce: the trusted path takes the backend nonce as-is,
            // while the untrusted path caps it at the lowest locally-known pending nonce.
            mockUseSelector.mockReturnValue([evmTx(4, { confirmed: false, type: 'sent' })]);
        });

        it('uses a trusted backend nonce as-is', () => {
            mockUseQuery.mockReturnValue({
                data: { nonce: '6', isTrusted: true },
                isLoading: false,
            } as any);

            const { nonceInfo } = useEvmNonceInfo(account);

            expect(nonceInfo).toEqual({
                confirmedNonce: 6,
                nextNonce: 6,
                pendingNonces: [4],
                confirmedNonces: [],
            });
        });

        it('reconciles an untrusted account nonce against local data (caps it at the lowest pending nonce)', () => {
            mockUseQuery.mockReturnValue({
                data: { nonce: '6', isTrusted: false },
                isLoading: false,
            } as any);

            const { nonceInfo } = useEvmNonceInfo(account);

            expect(nonceInfo).toEqual({
                confirmedNonce: 4,
                nextNonce: 5,
                pendingNonces: [4],
                confirmedNonces: [],
            });
        });

        it('returns undefined nonce info while the query has no data yet', () => {
            mockUseQuery.mockReturnValue({ data: undefined, isLoading: true } as any);

            expect(useEvmNonceInfo(account)).toEqual({ nonceInfo: undefined, isLoading: false });
        });
    });
});
