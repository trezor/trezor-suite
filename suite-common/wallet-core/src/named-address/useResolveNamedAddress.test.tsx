/**
 * @jest-environment jsdom
 */
import { type ReactNode } from 'react';

import { ServicesProvider } from '@suite-common/dependency-injection';
import type { GetNamedAddressSupportDep, SymbolNamedAddressResolver } from '@suite-common/networks';
import { mockGetNamedAddressSupport } from '@suite-common/networks/mocks';
import { renderHookWithQueryClient, waitFor } from '@suite-common/test-utils';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module';

import { useResolveNamedAddress } from './useResolveNamedAddress';

jest.mock('@trezor/react-utils', () => ({
    ...jest.requireActual('@trezor/react-utils'),
    useDebouncedValue: <T,>(value: T) => value,
}));

const mockResolveNamedAddress = jest.fn();
const mockReverseResolveAddress = jest.fn();
const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');
const tsepSymbol = asNetworkSymbol('tsep');

// Stands in for the Ethereum network module: the hook classifies what the resolver reports and
// must not carry any notion of what a name looks like on a given network.
const namedAddressResolver: SymbolNamedAddressResolver = {
    supportsNamedAddress: symbol => symbol === ethSymbol || symbol === tsepSymbol,
    isNameLike: value => value.trim().includes('.'),
    isAddressLike: value => /^0x[a-fA-F0-9]{40}$/.test(value.trim()),
    resolveNamedAddress: (...args) => mockResolveNamedAddress(...args),
    reverseResolveAddress: (...args) => mockReverseResolveAddress(...args),
    resolveNamedProfile: jest.fn(),
};

const services: { networks: GetNamedAddressSupportDep } = {
    networks: {
        getNamedAddressSupport: mockGetNamedAddressSupport(namedAddressResolver),
    },
};

const renderResolveHook = (value: string, symbol: NetworkSymbol | null) =>
    renderHookWithQueryClient(() => useResolveNamedAddress(value, symbol), {
        wrapper: ({ children }: { children: ReactNode }) => (
            <ServicesProvider services={services}>{children}</ServicesProvider>
        ),
    });

const RESOLVED_HEX = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

describe('useResolveNamedAddress', () => {
    beforeEach(() => {
        mockResolveNamedAddress.mockReset();
        mockReverseResolveAddress.mockReset();
    });

    const expectNoResolution = () => {
        expect(mockResolveNamedAddress).not.toHaveBeenCalled();
        expect(mockReverseResolveAddress).not.toHaveBeenCalled();
    };

    describe('idle mode (no fetch)', () => {
        it('is idle for an unsupported symbol', () => {
            const { result } = renderResolveHook('vitalik.eth', btcSymbol);

            expect(result.current.mode).toBe('idle');
            expect(result.current.isResolving).toBe(false);
            expect(result.current.resolvedAddress).toBeUndefined();
            expectNoResolution();
        });

        it('is idle when the symbol is null', () => {
            const { result } = renderResolveHook('vitalik.eth', null);

            expect(result.current.mode).toBe('idle');
            expectNoResolution();
        });

        it('is idle for a bare identifier without a dot', () => {
            const { result } = renderResolveHook('vitalik', ethSymbol);

            expect(result.current.mode).toBe('idle');
            expectNoResolution();
        });

        it('is idle for a hex address on an unsupported symbol', () => {
            const { result } = renderResolveHook(RESOLVED_HEX, btcSymbol);

            expect(result.current.mode).toBe('idle');
            expectNoResolution();
        });
    });

    describe('forward mode', () => {
        it('resolves a named input on eth mainnet', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            const { result } = renderResolveHook('vitalik.eth', ethSymbol);

            expect(result.current.mode).toBe('forward');

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data).toBe(RESOLVED_HEX);
            expect(result.current.resolvedAddress).toBe(RESOLVED_HEX);
            expect(result.current.reverseResolvedName).toBeUndefined();
            expect(result.current.isResolveError).toBe(false);
            expect(mockResolveNamedAddress).toHaveBeenCalledWith('vitalik.eth', ethSymbol);
        });

        it('resolves a named input on tsep', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            const { result } = renderResolveHook('vitalik.eth', tsepSymbol);

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.resolvedAddress).toBe(RESOLVED_HEX);
            expect(mockResolveNamedAddress).toHaveBeenCalledWith('vitalik.eth', tsepSymbol);
        });

        it('trims whitespace before resolving', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            const { result } = renderResolveHook('  vitalik.eth  ', ethSymbol);

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(mockResolveNamedAddress).toHaveBeenCalledWith('vitalik.eth', ethSymbol);
        });
    });

    describe('reverse mode', () => {
        it('reverse-resolves a hex address to its primary name', async () => {
            mockReverseResolveAddress.mockResolvedValue('vitalik.eth');

            const { result } = renderResolveHook(RESOLVED_HEX, ethSymbol);

            expect(result.current.mode).toBe('reverse');

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.reverseResolvedName).toBe('vitalik.eth');
            expect(result.current.resolvedAddress).toBeUndefined();
            expect(mockReverseResolveAddress).toHaveBeenCalledWith(RESOLVED_HEX, ethSymbol);
            expect(mockResolveNamedAddress).not.toHaveBeenCalled();
        });

        it('reverse-resolves an address that is not checksummed', async () => {
            mockReverseResolveAddress.mockResolvedValue('vitalik.eth');

            const { result } = renderResolveHook(RESOLVED_HEX.toLowerCase(), ethSymbol);

            expect(result.current.mode).toBe('reverse');
            await waitFor(() => expect(result.current.reverseResolvedName).toBe('vitalik.eth'));
        });

        it('an address with no primary name is not an error', async () => {
            mockReverseResolveAddress.mockResolvedValue(null);

            const { result } = renderResolveHook(RESOLVED_HEX, ethSymbol);

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.reverseResolvedName).toBeUndefined();
            expect(result.current.isResolveError).toBe(false);
        });
    });

    describe('error states', () => {
        it('surfaces a query error when resolution fails', async () => {
            mockResolveNamedAddress.mockRejectedValue(new Error('not found'));

            const { result } = renderResolveHook('nope.eth', ethSymbol);

            await waitFor(() => expect(result.current.isError).toBe(true));
            expect(result.current.error).toBeInstanceOf(Error);
            expect((result.current.error as Error).message).toBe('not found');
            expect(result.current.isResolveError).toBe(true);
            expect(result.current.resolvedAddress).toBeUndefined();
        });

        it('treats a name with no record as a resolve error', async () => {
            mockResolveNamedAddress.mockResolvedValue(null);

            const { result } = renderResolveHook('nope.eth', ethSymbol);

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.isResolveError).toBe(true);
            expect(result.current.resolvedAddress).toBeUndefined();
        });
    });
});
