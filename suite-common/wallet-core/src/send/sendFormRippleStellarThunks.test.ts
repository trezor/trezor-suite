import { createTestStore } from '@suite-common/test-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { type Account, type FeeInfo, type FormState } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { composeRippleStellarTransactionFeeLevelsThunk } from './sendFormRippleStellarThunks';

const mockPrepareContractTokenTransfer = jest.fn();
const mockResolveStellarContractId = jest.fn();
// The classic asset behind CONTRACT_TOKEN; any other contract id has no SAC id in these tests.
const SAC_OF_CLASSIC_TOKEN = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';

jest.mock('@trezor/network-stellar/runtime', () => ({
    __esModule: true,
    default: () =>
        Promise.resolve({
            prepareContractTokenTransfer: (...args: unknown[]) =>
                mockPrepareContractTokenTransfer(...args),
            computeSorobanAssetContractId: (classicContract: string) => {
                if (classicContract.startsWith('USDC-')) {
                    return { sorobanAssetContractId: SAC_OF_CLASSIC_TOKEN };
                }
                throw new Error('Invalid Stellar asset contract format.');
            },
            parseClassicAssetContract: (contract: string) => {
                const [assetCode, assetIssuer, ...rest] = contract.split('-');

                return rest.length === 0 && assetCode && assetIssuer
                    ? { assetCode, assetIssuer }
                    : undefined;
            },
        }),
}));

jest.mock('@suite-common/wallet-utils', () => ({
    ...jest.requireActual('@suite-common/wallet-utils'),
    resolveStellarContractId: (...args: unknown[]) => mockResolveStellarContractId(...args),
}));

const BACKEND_URL = 'https://xlm.trezor.io';
const DESTINATION = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const ISSUER = 'GBDVX4VELCDSQ54KQJYTNHXAHFLBCA77ZY2USQBM4CSHTTV7DME7KALE';
const CONTRACT_TOKEN = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';
// Six decimals, so anything formatted with the network's seven is off by a factor of ten.
const SIX_DECIMAL_TOKEN = 'CBI7UCH5KGSVQRO5H4SUCZUTZABCITZLRHQQZTWL2TK4RZ72TAR6IHRW';
const CLASSIC_TOKEN = `USDC-${ISSUER}`;

const account = {
    key: 'GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV-xlm-device',
    symbol: 'xlm',
    networkType: 'stellar',
    descriptor: 'GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV',
    balance: '10000000000',
    availableBalance: '10000000000',
    misc: { stellarSequence: '42', reserve: '10000000', baseReserve: '5000000' },
    tokens: [
        {
            standard: 'STELLAR-CONTRACT',
            contract: CONTRACT_TOKEN,
            // Units, as `enhanceTokens` stores them on the account.
            balance: '100',
            decimals: 7,
            symbol: 'USDC',
            name: 'USD Coin',
        },
        {
            standard: 'STELLAR-CLASSIC',
            contract: CLASSIC_TOKEN,
            balance: '100',
            decimals: 7,
            symbol: 'USDC',
            name: 'USD Coin',
        },
        {
            standard: 'STELLAR-CONTRACT',
            contract: SIX_DECIMAL_TOKEN,
            balance: '1',
            decimals: 6,
            symbol: 'MICRO',
            name: 'Micro Token',
        },
    ],
} as unknown as Account;

const feeInfo: FeeInfo = {
    blockHeight: 0,
    blockTime: -1,
    minFee: 100,
    maxFee: 10000000,
    minPriorityFee: -1,
    levels: [{ label: 'normal', feePerUnit: '100', blocks: -1 }],
};

const formState = (overrides?: Partial<FormState>): FormState =>
    ({
        outputs: [{ type: 'payment', address: DESTINATION, amount: '5', token: CONTRACT_TOKEN }],
        selectedFee: 'normal',
        options: ['broadcast'],
        ...overrides,
    }) as unknown as FormState;

const compose = (form: FormState) =>
    createTestStore({
        extra: undefined,
        preloadedState: { wallet: { blockchain: { xlm: { url: BACKEND_URL } } } },
    })
        .dispatch(
            composeRippleStellarTransactionFeeLevelsThunk({
                formState: form,
                composeContext: { account, network: getNetwork('xlm'), feeInfo },
            }),
        )
        .unwrap();

describe(composeRippleStellarTransactionFeeLevelsThunk.name, () => {
    let mockGetAccountInfo: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetAccountInfo = jest.spyOn(TrezorConnect, 'getAccountInfo').mockResolvedValue({
            success: true,
            payload: {
                descriptor: DESTINATION,
                empty: false,
                tokens: [{ contract: CLASSIC_TOKEN }],
            },
        } as any);
        mockResolveStellarContractId.mockResolvedValue(undefined);
        mockPrepareContractTokenTransfer.mockResolvedValue({
            transaction: { fee: '1234' },
            resourceFee: '1134',
        });
    });

    it('simulates a contract-token transfer with the amount in base units', async () => {
        const levels = await compose(formState());

        expect(mockPrepareContractTokenTransfer).toHaveBeenCalledWith(
            expect.objectContaining({
                backendUrl: BACKEND_URL,
                descriptor: account.descriptor,
                sequence: '42',
                inclusionFee: '100',
                contract: CONTRACT_TOKEN,
                destination: DESTINATION,
                amount: '50000000',
                isTestnet: false,
            }),
        );
        expect(levels.normal).toMatchObject({
            type: 'final',
            fee: '1234',
            feePerByte: '100',
            totalSpent: '50000000',
            token: expect.objectContaining({ contract: CONTRACT_TOKEN }),
        });
    });

    it('converts the whole balance to base units when max is set', async () => {
        await compose(
            formState({
                outputs: [
                    { type: 'payment', address: DESTINATION, amount: '', token: CONTRACT_TOKEN },
                ],
                setMaxOutputId: 0,
            } as Partial<FormState>),
        );

        expect(mockPrepareContractTokenTransfer).toHaveBeenCalledWith(
            expect.objectContaining({ amount: '1000000000' }),
        );
    });

    it('does not simulate until a recipient is known', async () => {
        const levels = await compose(
            formState({
                outputs: [{ type: 'payment', address: '', amount: '5', token: CONTRACT_TOKEN }],
            } as Partial<FormState>),
        );

        expect(mockPrepareContractTokenTransfer).not.toHaveBeenCalled();
        expect(levels.normal).toMatchObject({ type: 'nonfinal', fee: '100' });
    });

    it('leaves a classic asset to the inclusion fee alone', async () => {
        const levels = await compose(
            formState({
                outputs: [
                    { type: 'payment', address: DESTINATION, amount: '5', token: CLASSIC_TOKEN },
                ],
            } as Partial<FormState>),
        );

        expect(mockPrepareContractTokenTransfer).not.toHaveBeenCalled();
        expect(levels.normal).toMatchObject({ type: 'final', fee: '100', totalSpent: '50000000' });
    });

    it('turns a failed simulation into an error level the form can show', async () => {
        mockPrepareContractTokenTransfer.mockRejectedValue(
            new Error('trustline missing\nEvent log (newest first): ...'),
        );

        const levels = await compose(formState());

        expect(levels.normal).toEqual({
            type: 'error',
            error: 'TR_STELLAR_SIMULATION_FAILED',
            errorMessage: {
                id: 'TR_STELLAR_SIMULATION_FAILED',
                values: { reason: 'trustline missing' },
            },
        });
    });

    it('asks for the recipient trustline of a classic asset and refuses a recipient without it', async () => {
        mockGetAccountInfo.mockResolvedValue({
            success: true,
            payload: { descriptor: DESTINATION, empty: false, tokens: [] },
        } as any);

        const levels = await compose(
            formState({
                outputs: [
                    { type: 'payment', address: DESTINATION, amount: '5', token: CLASSIC_TOKEN },
                ],
            } as Partial<FormState>),
        );

        expect(mockGetAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                descriptor: DESTINATION,
                stellarClassicTokens: [CLASSIC_TOKEN],
            }),
        );
        expect(levels.normal).toEqual({
            type: 'error',
            error: 'TR_STELLAR_RECIPIENT_MISSING_TRUSTLINE',
            errorMessage: {
                id: 'TR_STELLAR_RECIPIENT_MISSING_TRUSTLINE',
                values: { symbol: 'USDC' },
            },
        });
    });

    it('treats an unfunded recipient as unable to receive a classic asset', async () => {
        mockGetAccountInfo.mockResolvedValue({
            success: true,
            payload: { descriptor: DESTINATION, empty: true, misc: { reserve: '10000000' } },
        } as any);

        const levels = await compose(
            formState({
                outputs: [
                    { type: 'payment', address: DESTINATION, amount: '5', token: CLASSIC_TOKEN },
                ],
            } as Partial<FormState>),
        );

        expect(levels.normal).toMatchObject({ error: 'TR_STELLAR_RECIPIENT_MISSING_TRUSTLINE' });
    });

    it('lets a Stellar Asset Contract through when the recipient holds the classic trustline', async () => {
        const levels = await compose(formState());

        expect(mockResolveStellarContractId).not.toHaveBeenCalled();
        expect(mockPrepareContractTokenTransfer).toHaveBeenCalled();
        expect(levels.normal).toMatchObject({ type: 'final' });
    });

    it('refuses a Stellar Asset Contract when the recipient lacks the classic trustline', async () => {
        mockGetAccountInfo.mockResolvedValue({
            success: true,
            payload: { descriptor: DESTINATION, empty: false, tokens: [] },
        } as any);
        mockResolveStellarContractId.mockResolvedValue({ assetCode: 'USDC', assetIssuer: ISSUER });

        const levels = await compose(formState());

        expect(mockResolveStellarContractId).toHaveBeenCalledWith(CONTRACT_TOKEN);
        expect(levels.normal).toMatchObject({
            error: 'TR_STELLAR_RECIPIENT_MISSING_TRUSTLINE',
            errorMessage: { values: { symbol: 'USDC' } },
        });
    });

    it('pays a classic asset back to its issuer, which holds no trustline to its own asset', async () => {
        mockGetAccountInfo.mockResolvedValue({
            success: true,
            payload: { descriptor: ISSUER, empty: false, tokens: [] },
        } as any);

        const levels = await compose(
            formState({
                outputs: [{ type: 'payment', address: ISSUER, amount: '5', token: CLASSIC_TOKEN }],
            } as Partial<FormState>),
        );

        expect(levels.normal).toMatchObject({ type: 'final', totalSpent: '50000000' });
    });

    it('pays a Stellar Asset Contract back to the issuer of the asset it wraps', async () => {
        mockGetAccountInfo.mockResolvedValue({
            success: true,
            payload: { descriptor: ISSUER, empty: false, tokens: [] },
        } as any);
        mockResolveStellarContractId.mockResolvedValue({ assetCode: 'USDC', assetIssuer: ISSUER });

        const levels = await compose(
            formState({
                outputs: [{ type: 'payment', address: ISSUER, amount: '5', token: CONTRACT_TOKEN }],
            } as Partial<FormState>),
        );

        expect(levels.normal).toMatchObject({ type: 'final', fee: '1234' });
    });

    it('reports max in the units of the token being sent, not the network', async () => {
        const levels = await compose(
            formState({
                outputs: [
                    { type: 'payment', address: DESTINATION, amount: '', token: SIX_DECIMAL_TOKEN },
                ],
                setMaxOutputId: 0,
            } as Partial<FormState>),
        );

        expect(mockPrepareContractTokenTransfer).toHaveBeenCalledWith(
            expect.objectContaining({ amount: '1000000' }),
        );
        expect(levels.normal).toMatchObject({ type: 'final', max: '1' });
    });

    it('leaves a native SEP-41 token to the simulation when the recipient has no trustline', async () => {
        mockGetAccountInfo.mockResolvedValue({
            success: true,
            payload: { descriptor: DESTINATION, empty: false, tokens: [] },
        } as any);

        const levels = await compose(formState());

        expect(mockResolveStellarContractId).toHaveBeenCalledWith(CONTRACT_TOKEN);
        expect(levels.normal).toMatchObject({ type: 'final', fee: '1234' });
    });
});
