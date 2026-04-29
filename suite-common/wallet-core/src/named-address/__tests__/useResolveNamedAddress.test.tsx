/**
 * @jest-environment jsdom
 */
import { renderHookWithQueryClient, waitFor } from '@suite-common/test-utils';

import { useResolveNamedAddress } from '../useResolveNamedAddress';

// The `@suite-common/wallet-utils` barrel transitively loads `@stellar/stellar-sdk`,
// which references `TextEncoder` at module scope and breaks under jsdom. Stub the
// barrel with the real `namedAddressUtils` implementations so the hook still gets
// truthful `isSymbolSupportingNamedAddress` / `looksLikeNamedAddress` behavior.
jest.mock('@suite-common/wallet-utils', () =>
    jest.requireActual('@suite-common/wallet-utils/src/namedAddressUtils'),
);

jest.mock('@trezor/react-utils', () => ({
    ...jest.requireActual('@trezor/react-utils'),
    useDebouncedValue: <T,>(value: T) => value,
}));

const mockGetAddress = jest.fn();

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    default: {
        getAddress: (...args: unknown[]) => mockGetAddress(...args),
    },
}));

const RESOLVED_HEX = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

describe('useResolveNamedAddress', () => {
    beforeEach(() => {
        mockGetAddress.mockReset();
    });

    describe('idle mode (no fetch)', () => {
        it('is idle for an unsupported symbol', () => {
            const { result } = renderHookWithQueryClient(() =>
                useResolveNamedAddress('vitalik.eth', 'btc'),
            );

            expect(result.current.mode).toBe('idle');
            expect(result.current.isResolving).toBe(false);
            expect(result.current.resolvedAddress).toBeUndefined();
            expect(mockGetAddress).not.toHaveBeenCalled();
        });

        it('is idle when the symbol is null', () => {
            const { result } = renderHookWithQueryClient(() =>
                useResolveNamedAddress('vitalik.eth', null),
            );

            expect(result.current.mode).toBe('idle');
            expect(mockGetAddress).not.toHaveBeenCalled();
        });

        it('is idle when the value looks like a hex address (no dot)', () => {
            const { result } = renderHookWithQueryClient(() =>
                useResolveNamedAddress(RESOLVED_HEX, 'eth'),
            );

            expect(result.current.mode).toBe('idle');
            expect(mockGetAddress).not.toHaveBeenCalled();
        });

        it('is idle for a bare identifier without a dot', () => {
            const { result } = renderHookWithQueryClient(() =>
                useResolveNamedAddress('vitalik', 'eth'),
            );

            expect(result.current.mode).toBe('idle');
            expect(mockGetAddress).not.toHaveBeenCalled();
        });
    });

    describe('forward mode (resolves via Blockbook)', () => {
        it('resolves a named input on eth mainnet', async () => {
            mockGetAddress.mockResolvedValueOnce({
                success: true,
                payload: { address: RESOLVED_HEX },
            });

            const { result } = renderHookWithQueryClient(() =>
                useResolveNamedAddress('vitalik.eth', 'eth'),
            );

            expect(result.current.mode).toBe('forward');

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data).toBe(RESOLVED_HEX);
            expect(result.current.resolvedAddress).toBe(RESOLVED_HEX);
            expect(result.current.isResolveError).toBe(false);
            expect(mockGetAddress).toHaveBeenCalledWith({
                address: 'vitalik.eth',
                path: [],
            });
        });

        it('resolves a named input on tsep', async () => {
            mockGetAddress.mockResolvedValueOnce({
                success: true,
                payload: { address: RESOLVED_HEX },
            });

            const { result } = renderHookWithQueryClient(() =>
                useResolveNamedAddress('vitalik.eth', 'tsep'),
            );

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.resolvedAddress).toBe(RESOLVED_HEX);
        });

        it('trims whitespace before calling TrezorConnect', async () => {
            mockGetAddress.mockResolvedValueOnce({
                success: true,
                payload: { address: RESOLVED_HEX },
            });

            const { result } = renderHookWithQueryClient(() =>
                useResolveNamedAddress('  vitalik.eth  ', 'eth'),
            );

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(mockGetAddress).toHaveBeenCalledWith({
                address: 'vitalik.eth',
                path: [],
            });
        });
    });

    describe('error states', () => {
        it('surfaces a query error when TrezorConnect reports failure', async () => {
            mockGetAddress.mockResolvedValue({
                success: false,
                error: { message: 'not found' },
            });

            const { result } = renderHookWithQueryClient(() =>
                useResolveNamedAddress('nope.eth', 'eth'),
            );

            await waitFor(() => expect(result.current.isError).toBe(true));
            expect(result.current.error).toBeInstanceOf(Error);
            expect((result.current.error as Error).message).toBe('not found');
            expect(result.current.isResolveError).toBe(true);
            expect(result.current.resolvedAddress).toBeUndefined();
        });
    });
});
