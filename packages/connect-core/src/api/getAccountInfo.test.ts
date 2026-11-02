import { default as GetAccountInfo } from './getAccountInfo';
import { initBlockchain } from '../backend/BlockchainLink';

jest.mock('../backend/BlockchainLink', () => ({
    assertBackendSupported: jest.fn(),
    initBlockchain: jest.fn(),
}));

const DESCRIPTOR = 'GBSXTBPFJOJ64NSYRFE2F6P6TPMMSD45KQZH5TEWIBEAHICY6IZVGCET';
const CONTRACT = 'CBI7UCH5KGSVQRO5H4SUCZUTZABCITZLRHQQZTWL2TK4RZ72TAR6IHRV';

// The same taproot descriptor in the firmware `h` form and in the canonical apostrophe form.
const TAPROOT_DESCRIPTOR_WITH_H =
    '[5c9e228d/86h/0h/0h]tpubDCpt6oCoUgcQEPBUnZS4pijgjNySRDaJH8FyztXHnjxCH3z8jjHKGpX3zwtNs1U8ThRDb8ZbnAnZWc1KNLQx8fasQnk3f9Vaqu3JJXcYCF';
const TAPROOT_DESCRIPTOR_CANONICAL =
    "[5c9e228d/86'/0'/0']tpubDCpt6oCoUgcQEPBUnZS4pijgjNySRDaJH8FyztXHnjxCH3z8jjHKGpX3zwtNs1U8ThRDb8ZbnAnZWc1KNLQx8fasQnk3f9Vaqu3JJXcYCF";

const createMethod = (stellarContractTokens?: string[]) =>
    new GetAccountInfo({
        payload: {
            method: 'getAccountInfo',
            coin: 'xlm',
            descriptor: DESCRIPTOR,
            details: 'basic',
            ...(stellarContractTokens ? { stellarContractTokens } : {}),
        },
    });

describe(GetAccountInfo.name, () => {
    // Without `allowEmpty` an account watching nothing failed validation and never refreshed.
    it('accepts an empty watch list', () => {
        expect(() => createMethod([])).not.toThrow();
    });

    it('accepts a populated watch list', () => {
        const method = createMethod([CONTRACT]);

        // `params` is protected; element access is how a test may read it.
        expect(method['params'][0]!.stellarContractTokens).toEqual([CONTRACT]);
    });

    it('accepts an omitted watch list', () => {
        expect(() => createMethod()).not.toThrow();
    });

    // Blockbook rejects the `h` form (#16748), while the SDK contract is that the returned
    // descriptor matches the requested one, so the two forms must not be mixed up.
    it('sends the canonical descriptor to the backend and returns the requested form', async () => {
        const getAccountInfo = jest
            .fn()
            .mockResolvedValue({ descriptor: TAPROOT_DESCRIPTOR_CANONICAL, empty: true });
        jest.mocked(initBlockchain).mockResolvedValue({ getAccountInfo } as any);

        const account = await new GetAccountInfo({
            payload: {
                method: 'getAccountInfo',
                coin: 'test',
                descriptor: TAPROOT_DESCRIPTOR_WITH_H,
                details: 'basic',
            },
        }).run({ sendCoreMessage: jest.fn() } as any);

        expect(getAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({ descriptor: TAPROOT_DESCRIPTOR_CANONICAL }),
        );
        expect(account).toMatchObject({ descriptor: TAPROOT_DESCRIPTOR_WITH_H });
    });
});
