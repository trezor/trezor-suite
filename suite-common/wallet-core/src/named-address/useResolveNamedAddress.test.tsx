/**
 * @jest-environment jsdom
 */
import { type ReactNode } from 'react';

import { ServicesProvider } from '@suite-common/dependency-injection';
import type { NetworkModuleRepository, NetworkSymbol } from '@suite-common/networks';
import { renderHookWithQueryClient, waitFor } from '@suite-common/test-utils';

import type { SymbolNamedAddressResolver } from './namedAddressResolver';
import { useResolveNamedAddress } from './useResolveNamedAddress';

jest.mock('@trezor/react-utils', () => ({
    ...jest.requireActual('@trezor/react-utils'),
    useDebouncedValue: <T,>(value: T) => value,
}));

const mockResolveNamedAddress = jest.fn();
const mockReverseResolveAddress = jest.fn();

// Stands in for the Ethereum network module: the hook classifies what the resolver reports and
// must not carry any notion of what a name looks like on a given network.
const namedAddressResolver: SymbolNamedAddressResolver = {
    supportsNamedAddress: symbol => symbol === 'eth' || symbol === 'tsep',
    isNameLike: value => value.trim().includes('.'),
    isAddressLike: value => /^0x[a-fA-F0-9]{40}$/.test(value.trim()),
    resolveNamedAddress: (...args) => mockResolveNamedAddress(...args),
    reverseResolveAddress: (...args) => mockReverseResolveAddress(...args),
    resolveNamedProfile: jest.fn(),
};

const networkModuleRepository = {
    get: () => ({ namedAddressResolver }),
} as unknown as NetworkModuleRepository;

const renderResolveHook = (value: string, symbol: NetworkSymbol | null) =>
    renderHookWithQueryClient(() => useResolveNamedAddress(value, symbol), {
        wrapper: ({ children }: { children: ReactNode }) => (
            <ServicesProvider services={{ networkModuleRepository }}>{children}</ServicesProvider>
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
            const { result } = renderResolveHook('vitalik.eth', 'btc');

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
            const { result } = renderResolveHook('vitalik', 'eth');

            expect(result.current.mode).toBe('idle');
            expectNoResolution();
        });

        it('is idle for a hex address on an unsupported symbol', () => {
            const { result } = renderResolveHook(RESOLVED_HEX, 'btc');

            expect(result.current.mode).toBe('idle');
            expectNoResolution();
        });
    });

    describe('forward mode', () => {
        it('resolves a named input on eth mainnet', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            const { result } = renderResolveHook('vitalik.eth', 'eth');

            expect(result.current.mode).toBe('forward');

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data).toBe(RESOLVED_HEX);
            expect(result.current.resolvedAddress).toBe(RESOLVED_HEX);
            expect(result.current.reverseResolvedName).toBeUndefined();
            expect(result.current.isResolveError).toBe(false);
            expect(mockResolveNamedAddress).toHaveBeenCalledWith('vitalik.eth', 'eth');
        });

        it('resolves a named input on tsep', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            const { result } = renderResolveHook('vitalik.eth', 'tsep');

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.resolvedAddress).toBe(RESOLVED_HEX);
            expect(mockResolveNamedAddress).toHaveBeenCalledWith('vitalik.eth', 'tsep');
        });

        it('trims whitespace before resolving', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            const { result } = renderResolveHook('  vitalik.eth  ', 'eth');

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(mockResolveNamedAddress).toHaveBeenCalledWith('vitalik.eth', 'eth');
        });
    });

    describe('reverse mode', () => {
        it('reverse-resolves a hex address to its primary name', async () => {
            mockReverseResolveAddress.mockResolvedValue('vitalik.eth');

            const { result } = renderResolveHook(RESOLVED_HEX, 'eth');

            expect(result.current.mode).toBe('reverse');

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.reverseResolvedName).toBe('vitalik.eth');
            expect(result.current.resolvedAddress).toBeUndefined();
            expect(mockReverseResolveAddress).toHaveBeenCalledWith(RESOLVED_HEX, 'eth');
            expect(mockResolveNamedAddress).not.toHaveBeenCalled();
        });

        it('reverse-resolves an address that is not checksummed', async () => {
            mockReverseResolveAddress.mockResolvedValue('vitalik.eth');

            const { result } = renderResolveHook(RESOLVED_HEX.toLowerCase(), 'eth');

            expect(result.current.mode).toBe('reverse');
            await waitFor(() => expect(result.current.reverseResolvedName).toBe('vitalik.eth'));
        });

        it('an address with no primary name is not an error', async () => {
            mockReverseResolveAddress.mockResolvedValue(null);

            const { result } = renderResolveHook(RESOLVED_HEX, 'eth');

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.reverseResolvedName).toBeUndefined();
            expect(result.current.isResolveError).toBe(false);
        });
    });

    describe('error states', () => {
        it('surfaces a query error when resolution fails', async () => {
            mockResolveNamedAddress.mockRejectedValue(new Error('not found'));

            const { result } = renderResolveHook('nope.eth', 'eth');

            await waitFor(() => expect(result.current.isError).toBe(true));
            expect(result.current.error).toBeInstanceOf(Error);
            expect((result.current.error as Error).message).toBe('not found');
            expect(result.current.isResolveError).toBe(true);
            expect(result.current.resolvedAddress).toBeUndefined();
        });

        it('treats a name with no record as a resolve error', async () => {
            mockResolveNamedAddress.mockResolvedValue(null);

            const { result } = renderResolveHook('nope.eth', 'eth');

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.isResolveError).toBe(true);
            expect(result.current.resolvedAddress).toBeUndefined();
        });
    });
});
