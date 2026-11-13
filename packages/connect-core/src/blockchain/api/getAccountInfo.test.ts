import { initCoinBackend } from '@trezor/blockchain-core/src/backend/BlockchainLink';

import { getAccountInfo } from './getAccountInfo';

jest.mock('@trezor/blockchain-core/src/backend/BlockchainLink', () => ({
    initCoinBackend: jest.fn(),
}));

const DESCRIPTOR = 'GBSXTBPFJOJ64NSYRFE2F6P6TPMMSD45KQZH5TEWIBEAHICY6IZVGCET';
const CONTRACT = 'CBI7UCH5KGSVQRO5H4SUCZUTZABCITZLRHQQZTWL2TK4RZ72TAR6IHRV';

// The same taproot descriptor in the firmware `h` form and in the canonical apostrophe form.
const TAPROOT_DESCRIPTOR_WITH_H =
    '[5c9e228d/86h/0h/0h]tpubDCpt6oCoUgcQEPBUnZS4pijgjNySRDaJH8FyztXHnjxCH3z8jjHKGpX3zwtNs1U8ThRDb8ZbnAnZWc1KNLQx8fasQnk3f9Vaqu3JJXcYCF';
const TAPROOT_DESCRIPTOR_CANONICAL =
    "[5c9e228d/86'/0'/0']tpubDCpt6oCoUgcQEPBUnZS4pijgjNySRDaJH8FyztXHnjxCH3z8jjHKGpX3zwtNs1U8ThRDb8ZbnAnZWc1KNLQx8fasQnk3f9Vaqu3JJXcYCF";

describe(getAccountInfo.name, () => {
    const backendGetAccountInfo = jest.fn();

    beforeEach(() => {
        backendGetAccountInfo
            .mockReset()
            .mockImplementation(({ descriptor }) => Promise.resolve({ descriptor, empty: true }));
        jest.mocked(initCoinBackend).mockResolvedValue({
            getAccountInfo: backendGetAccountInfo,
        } as any);
    });

    // Without `allowEmpty` an account watching nothing failed validation and never refreshed.
    it.each([[[]], [[CONTRACT]], [undefined]])(
        'accepts the watch list %j',
        async stellarContractTokens => {
            await getAccountInfo(
                { coin: 'xlm', descriptor: DESCRIPTOR, details: 'basic', stellarContractTokens },
                jest.fn(),
            );

            expect(backendGetAccountInfo).toHaveBeenCalledWith(
                expect.objectContaining({ stellarContractTokens }),
            );
        },
    );

    // Blockbook rejects the `h` form (#16748), while the SDK contract is that the returned
    // descriptor matches the requested one, so the two forms must not be mixed up.
    it('sends the canonical descriptor to the backend and returns the requested form', async () => {
        const account = await getAccountInfo(
            { coin: 'test', descriptor: TAPROOT_DESCRIPTOR_WITH_H, details: 'basic' },
            jest.fn(),
        );

        expect(backendGetAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({ descriptor: TAPROOT_DESCRIPTOR_CANONICAL }),
        );
        expect(account).toMatchObject({ descriptor: TAPROOT_DESCRIPTOR_WITH_H });
    });
});
