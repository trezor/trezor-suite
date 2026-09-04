import { SCHEDULE_ACTION_TIMEOUT_ERROR_MESSAGE } from '@trezor/utils';

import { resolveNamedAddress } from './resolveNamedAddress';
import { resolveViaBlockbook } from './resolveNamedAddressBB';
import { resolveNamedAddressOnchain } from './universalResolver';

jest.mock('./universalResolver', () => ({
    resolveNamedAddressOnchain: jest.fn(),
}));

jest.mock('./resolveNamedAddressBB', () => ({
    resolveViaBlockbook: jest.fn(),
}));

const mockResolveOnchain = jest.mocked(resolveNamedAddressOnchain);
const mockResolveViaBlockbook = jest.mocked(resolveViaBlockbook);

const VITALIK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

describe('resolveNamedAddress', () => {
    beforeEach(() => {
        mockResolveOnchain.mockReset();
        mockResolveViaBlockbook.mockReset();
    });

    it('returns the onchain result without touching Blockbook', async () => {
        mockResolveOnchain.mockResolvedValue(VITALIK_ADDRESS);

        await expect(resolveNamedAddress('vitalik.eth', 'eth')).resolves.toBe(VITALIK_ADDRESS);
        expect(mockResolveViaBlockbook).not.toHaveBeenCalled();
    });

    it('treats a null onchain result as definitive and does not fall back', async () => {
        mockResolveOnchain.mockResolvedValue(null);

        await expect(resolveNamedAddress('nope.eth', 'eth')).resolves.toBeNull();
        expect(mockResolveViaBlockbook).not.toHaveBeenCalled();
    });

    it('falls back to Blockbook when the onchain call fails', async () => {
        mockResolveOnchain.mockRejectedValue(new Error('Backend not connected'));
        mockResolveViaBlockbook.mockResolvedValue(VITALIK_ADDRESS);

        await expect(resolveNamedAddress('vitalik.eth', 'eth')).resolves.toBe(VITALIK_ADDRESS);
        expect(mockResolveViaBlockbook).toHaveBeenCalledWith('vitalik.eth', 'eth');
    });

    it('reports a Blockbook answer that is not an address as no record', async () => {
        mockResolveOnchain.mockRejectedValue(new Error('Backend not connected'));
        mockResolveViaBlockbook.mockResolvedValue(null);

        await expect(resolveNamedAddress('vitalik.eth', 'eth')).resolves.toBeNull();
    });

    // The send form awaits this before it can validate, so a backend that takes the request and
    // never answers must not hold the field open for as long as it likes.
    it('gives up once the whole resolution outruns its budget', async () => {
        jest.useFakeTimers();
        mockResolveOnchain.mockReturnValue(new Promise(() => {}));

        try {
            // The rejection has to be caught up front: the assertion can only run once the
            // timers below have advanced, and an unhandled rejection in between fails the run.
            const resolution = resolveNamedAddress('vitalik.eth', 'eth').catch(error => error);

            // Past any budget the onchain attempt and the fallback could share.
            await jest.advanceTimersByTimeAsync(60_000);

            await expect(resolution).resolves.toMatchObject({
                message: SCHEDULE_ACTION_TIMEOUT_ERROR_MESSAGE,
            });
        } finally {
            jest.useRealTimers();
        }
    });

    it('propagates the Blockbook failure when both paths fail', async () => {
        mockResolveOnchain.mockRejectedValue(new Error('Backend not connected'));
        mockResolveViaBlockbook.mockRejectedValue(new Error('Blockbook unavailable'));

        await expect(resolveNamedAddress('vitalik.eth', 'eth')).rejects.toThrow(
            'Blockbook unavailable',
        );
    });
});
