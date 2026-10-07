import { asNetworkSymbol } from '@trezor/network-module-types';

import { ChainNetworkError } from './ChainNetworkError';
import {
    type FetchConnectAccountBalanceDeps,
    type FetchConnectAccountBalanceParams,
    createFetchConnectAccountBalance,
} from './createFetchConnectAccountBalance';

const DESCRIPTOR = 'xpub-confidential-descriptor';

const mockGetAccountInfo = jest.fn();

const deps: FetchConnectAccountBalanceDeps = {
    getTrezorConnect: () => ({ getAccountInfo: mockGetAccountInfo }),
};

const fetchAccountBalance = createFetchConnectAccountBalance(deps);

const getParams = (
    overrides: Partial<FetchConnectAccountBalanceParams> = {},
): FetchConnectAccountBalanceParams => ({
    ref: {
        symbol: asNetworkSymbol('eth'),
        descriptor: DESCRIPTOR,
        accountType: 'normal',
        connectionIdentity: 'wallet-identity',
    },
    signal: new AbortController().signal,
    decimals: 18,
    displayBalance: 'availableBalance',
    useConnectionIdentity: true,
    ...overrides,
});

describe('createFetchConnectAccountBalance', () => {
    beforeEach(() => {
        mockGetAccountInfo.mockReset();
    });

    it('asks Connect for the basic account info only', async () => {
        mockGetAccountInfo.mockResolvedValue({
            success: true,
            payload: { balance: '0', availableBalance: '0', empty: true },
        });

        await fetchAccountBalance(getParams({ gap: 30 }));

        expect(mockGetAccountInfo).toHaveBeenCalledWith({
            coin: 'eth',
            descriptor: DESCRIPTOR,
            details: 'basic',
            suppressBackupWarning: true,
            identity: 'wallet-identity',
            gap: 30,
        });
    });

    it('leaves the connection identity out for networks that do not use it', async () => {
        mockGetAccountInfo.mockResolvedValue({
            success: true,
            payload: { balance: '0', availableBalance: '0', empty: true },
        });

        await fetchAccountBalance(getParams({ useConnectionIdentity: false }));

        expect(mockGetAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({ identity: undefined }),
        );
    });

    it.each([
        { decimals: 8, subunits: '123456789', units: '1.23456789' },
        { decimals: 18, subunits: '1500000000000000000', units: '1.5' },
        { decimals: 9, subunits: '2000000001', units: '2.000000001' },
    ])('converts $subunits with $decimals decimals', async ({ decimals, subunits, units }) => {
        mockGetAccountInfo.mockResolvedValue({
            success: true,
            payload: { balance: subunits, availableBalance: subunits, empty: false },
        });

        await expect(fetchAccountBalance(getParams({ decimals }))).resolves.toEqual({
            balance: units,
            availableBalance: units,
            displayBalance: units,
            empty: false,
        });
    });

    it.each([
        { displayBalance: 'availableBalance' as const, expected: '0.9' },
        { displayBalance: 'balance' as const, expected: '1' },
    ])('displays the $displayBalance', async ({ displayBalance, expected }) => {
        mockGetAccountInfo.mockResolvedValue({
            success: true,
            payload: { balance: '10', availableBalance: '9', empty: false },
        });

        const result = await fetchAccountBalance(getParams({ decimals: 1, displayBalance }));

        expect(result.displayBalance).toBe(expected);
    });

    it('fails with a code and never with the backend message', async () => {
        mockGetAccountInfo.mockResolvedValue({
            success: false,
            error: { message: `Invalid descriptor ${DESCRIPTOR}` },
        });

        const error = await fetchAccountBalance(getParams()).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ChainNetworkError);
        expect(error).toMatchObject({
            code: 'account-info-failed',
            symbol: asNetworkSymbol('eth'),
        });
        expect(String(error)).not.toContain(DESCRIPTOR);
    });
});
