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
        expect(mockResolveViaBlockbook).toHaveBeenCalledWith('vitalik.eth', 'eth', undefined);
    });

    it('carries the backend identity into both paths', async () => {
        mockResolveOnchain.mockRejectedValue(new Error('Backend not connected'));
        mockResolveViaBlockbook.mockResolvedValue(VITALIK_ADDRESS);

        await resolveNamedAddress('vitalik.eth', 'eth', { identity: 'deviceState' });

        const options = { identity: 'deviceState' };
        expect(mockResolveOnchain).toHaveBeenCalledWith('vitalik.eth', 'eth', options);
        expect(mockResolveViaBlockbook).toHaveBeenCalledWith('vitalik.eth', 'eth', options);
    });

    it('propagates the Blockbook failure when both paths fail', async () => {
        mockResolveOnchain.mockRejectedValue(new Error('Backend not connected'));
        mockResolveViaBlockbook.mockRejectedValue(new Error('Blockbook unavailable'));

        await expect(resolveNamedAddress('vitalik.eth', 'eth')).rejects.toThrow(
            'Blockbook unavailable',
        );
    });
});
