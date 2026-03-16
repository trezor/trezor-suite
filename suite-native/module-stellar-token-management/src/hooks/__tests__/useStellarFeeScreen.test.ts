import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import {
    AuthorizeDeviceStackRoutes,
    RootStackRoutes,
    StellarManageTokenStackRoutes,
} from '@suite-native/navigation';
import {
    type TestStore,
    act,
    initStore,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-native/test-utils';
import { BASE_INFO } from '@trezor/blockchain-link-utils/src/stellar';
import { BigNumber } from '@trezor/utils';

import { useStellarFeeScreen } from '../useStellarFeeScreen';

type UseStellarFeeScreenParams = Parameters<typeof useStellarFeeScreen>[0];

const mockShowAlert = jest.fn();
const mockTranslate = jest.fn(key => key);
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockRevealConfirmOnTrezorSheet = jest.fn();
const mockCloseSheet = jest.fn();
const mockFormGetValues = jest.fn();

let focusEffectCallback: (() => void) | undefined;

const triggerFocusEffect = () => {
    focusEffectCallback?.();
};

const accountKey = 'stellar-1' as AccountKey;

const mockAccount = {
    key: accountKey,
    symbol: 'xlm',
    networkType: 'stellar',
    descriptor: 'GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV',
    balance: '10000000000',
    availableBalance: '10000000000',
    formattedBalance: '1000',
};

jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({
        showAlert: mockShowAlert,
    }),
}));

jest.mock('@suite-native/intl', () => ({
    ...jest.requireActual('@suite-native/intl'),
    useTranslate: () => ({
        translate: mockTranslate,
    }),
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
        goBack: mockGoBack,
    }),
    useFocusEffect: (callback: () => void) => {
        focusEffectCallback = callback;
    },
}));

jest.mock('@suite-native/confirm-on-trezor', () => ({
    ...jest.requireActual('@suite-native/confirm-on-trezor'),
    useConfirmOnTrezorController: () => ({
        revealConfirmOnTrezorSheet: mockRevealConfirmOnTrezorSheet,
        confirmOnTrezorRef: { current: null },
        closeSheet: mockCloseSheet,
    }),
}));

jest.mock('@suite-native/atoms', () => ({
    ...jest.requireActual('@suite-native/atoms'),
    useBottomSheetModal: () => ({
        bottomSheetRef: { current: null },
        openModal: jest.fn(),
        closeModal: jest.fn(),
    }),
}));

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectDeviceButtonRequestsCodes: jest.fn(),
    selectIsDeviceConnectedAndAuthorized: jest.fn(),
}));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectAccountByKey: jest.fn(),
    selectDeepCopyOfFormDraft: jest.fn(),
    fetchAndUpdateAccountThunk: jest.fn(),
}));

jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    selectFeeLevels: jest.fn(),
    useFeesManagement: jest.fn(),
}));

jest.mock('../useStellarTokenInfo', () => ({
    useStellarTokenInfo: (tokenContract: string) => {
        if (tokenContract === 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN') {
            return {
                tokenInfo: {
                    symbol: 'USDC',
                    name: 'USD Coin',
                    homeDomain: 'centre.io',
                    contract: tokenContract,
                },
            };
        }

        const [symbol = ''] = tokenContract.split('-');

        return {
            tokenInfo: {
                symbol,
                name: undefined,
                homeDomain: undefined,
                contract: tokenContract,
            },
        };
    },
}));

jest.mock('../../thunks', () => ({
    getStellarTokenFormDraftKey: (accountKeyParam: AccountKey, tokenContract: string) =>
        `stellar-token/${accountKeyParam}/${tokenContract}`,
    updateStellarTokenSelectedFeeLevelThunk: jest.fn(),
}));

const mockSelectAccountByKey = jest.requireMock('@suite-common/wallet-core').selectAccountByKey;
const mockSelectDeviceButtonRequestsCodes =
    jest.requireMock('@suite-common/device').selectDeviceButtonRequestsCodes;
const mockSelectIsDeviceConnectedAndAuthorized =
    jest.requireMock('@suite-common/device').selectIsDeviceConnectedAndAuthorized;
const mockSelectDeepCopyOfFormDraft = jest.requireMock(
    '@suite-common/wallet-core',
).selectDeepCopyOfFormDraft;
const mockFetchAndUpdateAccountThunk = jest.requireMock(
    '@suite-common/wallet-core',
).fetchAndUpdateAccountThunk;

const mockSelectFeeLevels = jest.requireMock(
    '@suite-native/transaction-management',
).selectFeeLevels;
const mockUseFeesManagement = jest.requireMock(
    '@suite-native/transaction-management',
).useFeesManagement;

const createFulfilledResult = () => ({
    type: 'stellar-token/fulfilled',
    meta: { requestStatus: 'fulfilled', requestId: 'test-request' },
});

const createRejectedResult = (payload?: { message?: string }) => ({
    type: 'stellar-token/rejected',
    payload,
    meta: { requestStatus: 'rejected', requestId: 'test-request' },
});

const createDeferred = () => {
    let resolve!: (value: unknown) => void;
    const promise = new Promise(res => {
        resolve = res;
    });

    return { promise, resolve };
};

describe('useStellarFeeScreen', () => {
    let store: TestStore;

    const mockThunkAction = jest.fn();
    const mockOnSuccess = jest.fn();

    const KNOWN_USDC_CONTRACT =
        'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' as TokenAddress;
    const UNKNOWN_TOKEN_CONTRACT =
        'UNKNOWN-GC2QJHYZSO5UV5DZYAQIQMSSGXERQPJC54PLA7NPLWTC7Y2TQFUT4QA7' as TokenAddress;

    const defaultProps: UseStellarFeeScreenParams = {
        accountKey,
        tokenContract: KNOWN_USDC_CONTRACT,
        mode: 'activation',
        thunkAction: mockThunkAction,
        onSuccess: mockOnSuccess,
    };

    const renderUseStellarFeeScreen = (props: UseStellarFeeScreenParams = defaultProps) =>
        renderHookWithStoreProvider(hookProps => useStellarFeeScreen(hookProps), {
            store,
            initialProps: props,
        });

    beforeEach(() => {
        jest.clearAllMocks();
        focusEffectCallback = undefined;
        ({ store } = initStore());

        mockSelectAccountByKey.mockReturnValue(mockAccount);
        mockSelectDeviceButtonRequestsCodes.mockReturnValue([]);
        mockSelectIsDeviceConnectedAndAuthorized.mockReturnValue(false);
        mockSelectDeepCopyOfFormDraft.mockReturnValue(undefined);
        mockSelectFeeLevels.mockReturnValue({
            normal: {
                type: 'final',
                fee: '100',
                feePerByte: '100',
            },
        });
        mockUseFeesManagement.mockReturnValue({
            form: { getValues: mockFormGetValues },
            selectedFeeLevel: 'normal',
            fee: '100',
            isSubmittable: true,
            areFeesLoading: false,
            feeLevels: { normal: { fee: '100' } },
            handleFeeLevelChange: jest.fn(),
            handleCustomFeeSet: jest.fn(),
        });
        mockFetchAndUpdateAccountThunk.mockReturnValue({ type: 'fetch-account' });
    });

    it('returns correct token info for known USDC token', () => {
        const { result } = renderUseStellarFeeScreen();

        expect(result.current.tokenName).toBe('USD Coin');
        expect(result.current.issuerDomain).toBe('centre.io');
        expect(result.current.iconContractAddress).toBe(KNOWN_USDC_CONTRACT);
    });

    it('falls back to unknown issuer for unknown token', () => {
        const { result } = renderUseStellarFeeScreen({
            ...defaultProps,
            tokenContract: UNKNOWN_TOKEN_CONTRACT,
        });

        expect(result.current.tokenName).toBe('UNKNOWN');
        expect(result.current.issuerDomain).toBe('moduleStellarToken.tokenDetail.unknownIssuer');
        expect(result.current.iconContractAddress).toBeUndefined();
    });

    it('returns insufficientBalanceInfo when balance is insufficient', () => {
        const lowBalanceAccount = { ...mockAccount, availableBalance: '1' };
        mockSelectAccountByKey.mockReturnValue(lowBalanceAccount);

        const { result } = renderUseStellarFeeScreen();

        const requiredAmount = BigNumber('100').plus(BASE_INFO.BASE_RESERVE).toString();

        expect(result.current.insufficientBalanceInfo).toEqual({
            required: requiredAmount,
            available: '1',
        });
    });

    it('returns null for insufficientBalanceInfo in deactivation mode', () => {
        const lowBalanceAccount = { ...mockAccount, availableBalance: '1' };
        mockSelectAccountByKey.mockReturnValue(lowBalanceAccount);

        const { result } = renderUseStellarFeeScreen({
            ...defaultProps,
            mode: 'deactivation',
        });

        expect(result.current.insufficientBalanceInfo).toBeNull();
    });

    it('handleCancel closes sheet, navigates back, and clears submitting state', () => {
        const { result } = renderUseStellarFeeScreen();

        act(() => {
            result.current.handleReviewAndSign();
        });
        expect(result.current.isSubmitting).toBe(true);

        act(() => {
            result.current.handleCancel();
        });

        expect(result.current.isSubmitting).toBe(false);
        expect(mockCloseSheet).toHaveBeenCalledTimes(1);
        expect(mockGoBack).toHaveBeenCalledTimes(1);
    });

    it('navigates to device connection guard and sets submitting state', () => {
        const { result } = renderUseStellarFeeScreen();

        act(() => {
            result.current.handleReviewAndSign();
        });

        expect(result.current.isSubmitting).toBe(true);
        expect(mockNavigate).toHaveBeenCalledWith(
            RootStackRoutes.AuthorizeDeviceStack,
            expect.objectContaining({
                screen: AuthorizeDeviceStackRoutes.DeviceConnectionGuard,
            }),
        );
    });

    it.each([
        ['activation', StellarManageTokenStackRoutes.ActivationFee],
        ['deactivation', StellarManageTokenStackRoutes.DeactivationFee],
    ])('uses %s screen as cancel target', (mode, expectedScreen) => {
        const { result } = renderUseStellarFeeScreen({
            ...defaultProps,
            mode: mode as 'activation' | 'deactivation',
        });

        act(() => {
            result.current.handleReviewAndSign();
        });

        expect(mockNavigate).toHaveBeenCalledWith(
            RootStackRoutes.AuthorizeDeviceStack,
            expect.objectContaining({
                params: expect.objectContaining({
                    onCancelNavigationTarget: expect.objectContaining({
                        params: expect.objectContaining({
                            screen: expectedScreen,
                        }),
                    }),
                }),
            }),
        );
    });

    it('executes sign flow on focus when device is connected', async () => {
        mockSelectIsDeviceConnectedAndAuthorized.mockReturnValue(true);
        mockThunkAction.mockImplementation(() => () => Promise.resolve(createFulfilledResult()));

        const { result } = renderUseStellarFeeScreen();

        act(() => {
            result.current.handleReviewAndSign();
        });

        await act(async () => {
            triggerFocusEffect();
            await Promise.resolve();
        });

        expect(mockThunkAction).toHaveBeenCalledWith({
            account: mockAccount,
            contractAddress: KNOWN_USDC_CONTRACT,
            selectedFee: 'normal',
            customFeePerUnit: undefined,
        });
        expect(mockFetchAndUpdateAccountThunk).toHaveBeenCalledWith({
            accountKey,
        });
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    it('passes custom fee per unit when selectedFeeLevel is custom', async () => {
        mockSelectIsDeviceConnectedAndAuthorized.mockReturnValue(true);
        mockFormGetValues.mockReturnValue('123');
        mockUseFeesManagement.mockReturnValue({
            form: { getValues: mockFormGetValues },
            selectedFeeLevel: 'custom',
            fee: '100',
            isSubmittable: true,
            areFeesLoading: false,
            feeLevels: { normal: { fee: '100' } },
            handleFeeLevelChange: jest.fn(),
            handleCustomFeeSet: jest.fn(),
        });
        mockThunkAction.mockImplementation(() => () => Promise.resolve(createFulfilledResult()));

        const { result } = renderUseStellarFeeScreen();

        act(() => {
            result.current.handleReviewAndSign();
        });

        await act(async () => {
            triggerFocusEffect();
            await Promise.resolve();
        });

        expect(mockThunkAction).toHaveBeenCalledWith(
            expect.objectContaining({
                selectedFee: 'custom',
                customFeePerUnit: '123',
            }),
        );
    });

    it('shows alert when sign flow is rejected', async () => {
        mockSelectIsDeviceConnectedAndAuthorized.mockReturnValue(true);
        mockThunkAction.mockImplementation(
            () => () => Promise.resolve(createRejectedResult({ message: 'Rejected by device' })),
        );

        const { result } = renderUseStellarFeeScreen();

        act(() => {
            result.current.handleReviewAndSign();
        });

        await act(async () => {
            triggerFocusEffect();
            await Promise.resolve();
        });

        expect(mockShowAlert).toHaveBeenCalledWith({
            title: 'moduleStellarToken.networkFee.activationFailed',
            description: 'Rejected by device',
            primaryButtonTitle: 'OK',
        });
        expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('shows and hides confirm on Trezor sheet based on button requests', async () => {
        const deferred = createDeferred();
        mockSelectIsDeviceConnectedAndAuthorized.mockReturnValue(true);
        mockSelectDeviceButtonRequestsCodes.mockReturnValue(['button-request']);
        mockThunkAction.mockImplementation(() => () => deferred.promise);

        const { result, rerender } = renderUseStellarFeeScreen();

        act(() => {
            result.current.handleReviewAndSign();
        });

        act(() => {
            triggerFocusEffect();
        });

        await waitFor(() => expect(mockRevealConfirmOnTrezorSheet).toHaveBeenCalledTimes(1));

        mockSelectDeviceButtonRequestsCodes.mockReturnValue([]);
        rerender(defaultProps);

        await waitFor(() => expect(mockCloseSheet).toHaveBeenCalledTimes(1));

        deferred.resolve(createFulfilledResult());
        await act(async () => {
            await deferred.promise;
        });
    });
});
