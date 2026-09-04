import { resolveViaBlockbook } from './resolveNamedAddressBB';

const mockGetAccountInfo = jest.fn();

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    default: {
        getAccountInfo: (...args: unknown[]) => mockGetAccountInfo(...args),
    },
}));

const VITALIK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

describe('resolveViaBlockbook', () => {
    beforeEach(() => {
        mockGetAccountInfo.mockReset();
    });

    it('resolves the name through the account descriptor', async () => {
        mockGetAccountInfo.mockResolvedValue({
            success: true,
            payload: { descriptor: VITALIK_ADDRESS },
        });

        await expect(resolveViaBlockbook('vitalik.eth', 'eth')).resolves.toBe(VITALIK_ADDRESS);
        expect(mockGetAccountInfo).toHaveBeenCalledWith({
            descriptor: 'vitalik.eth',
            coin: 'eth',
            details: 'basic',
        });
    });

    // Whatever comes back is signed as the recipient, so a descriptor that is not an address —
    // the name handed back unresolved, an empty answer — has to read as no record.
    it.each([['vitalik.eth'], [''], ['0xnothexatall']])(
        'answers null for the descriptor %p',
        async descriptor => {
            mockGetAccountInfo.mockResolvedValue({ success: true, payload: { descriptor } });

            await expect(resolveViaBlockbook('vitalik.eth', 'eth')).resolves.toBeNull();
        },
    );

    it('throws when the backend fails', async () => {
        mockGetAccountInfo.mockResolvedValue({
            success: false,
            error: { message: 'Blockbook unavailable' },
        });

        await expect(resolveViaBlockbook('vitalik.eth', 'eth')).rejects.toThrow(
            'Blockbook unavailable',
        );
    });
});
