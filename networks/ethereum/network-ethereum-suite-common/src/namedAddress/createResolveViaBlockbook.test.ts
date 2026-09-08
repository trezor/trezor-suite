import { createResolveViaBlockbook } from './createResolveViaBlockbook';

const mockGetAccountInfo = jest.fn();

const VITALIK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

describe('resolveViaBlockbook', () => {
    const resolveViaBlockbook = createResolveViaBlockbook({
        getTrezorConnect: () => ({ getAccountInfo: mockGetAccountInfo }),
    });

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

it('reads the current Connect implementation when resolving, not when constructing the resolver', async () => {
    const firstGetAccountInfo = jest.fn().mockResolvedValue({
        success: true,
        payload: { descriptor: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
    });
    const secondGetAccountInfo = jest.fn().mockResolvedValue({
        success: true,
        payload: { descriptor: '0x1234567890123456789012345678901234567890' },
    });
    let connect = { getAccountInfo: firstGetAccountInfo };
    const getTrezorConnect = jest.fn(() => connect);
    const resolveViaBlockbook = createResolveViaBlockbook({ getTrezorConnect });

    expect(getTrezorConnect).not.toHaveBeenCalled();
    await expect(resolveViaBlockbook('example.eth', 'eth')).resolves.toBe(
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    );

    connect = { ...connect, getAccountInfo: secondGetAccountInfo };
    await expect(resolveViaBlockbook('example.eth', 'eth')).resolves.toBe(
        '0x1234567890123456789012345678901234567890',
    );
    expect(firstGetAccountInfo).toHaveBeenCalledTimes(1);
    expect(secondGetAccountInfo).toHaveBeenCalledWith({
        descriptor: 'example.eth',
        coin: 'eth',
        details: 'basic',
    });
});
