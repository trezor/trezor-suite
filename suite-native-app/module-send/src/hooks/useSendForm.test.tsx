import { asNetworkSymbol } from '@suite-common/wallet-config';
import { sendFormActions } from '@suite-common/wallet-core';
import { type GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import {
    AuthorizeDeviceStackRoutes,
    RootStackRoutes,
    SendStackRoutes,
} from '@suite-native/navigation';
import { signTransactionNativeThunk } from '@suite-native/send';
import {
    act,
    createStoreFromPreloadedState,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-native/test-utils-store';
import { createMockDispatch } from '@trezor/redux-utils/mocks';
import { createDeferred } from '@trezor/utils';

import { useSendForm } from './useSendForm';

const mockSigningThunk = jest.fn();
const mockNavigation = { navigate: jest.fn(), popTo: jest.fn() };

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
}));
jest.mock('@suite-native/send', () => ({
    signTransactionNativeThunk: jest.fn(() => mockSigningThunk),
}));

const account = mockWalletAccount({
    symbol: asNetworkSymbol('xlm'),
    balance: '100000000',
    availableBalance: '100000000',
});
const finalTransaction: GeneralPrecomposedTransactionFinal = {
    type: 'final',
    totalSpent: '1000100',
    fee: '100',
    feePerByte: '100',
    bytes: 0,
    inputs: [],
    outputs: [],
    outputsPermutation: [],
};

const renderUseSendForm = async () => {
    const store = createStoreFromPreloadedState({
        analytics: { instanceId: undefined },
        messageSystem: { config: null, validExperiments: [], experimentInclusionOverrides: {} },
        device: { devices: [], selectedDevice: undefined },
        wallet: {
            accounts: [account],
            blockchain: {},
            fees: {
                xlm: {
                    status: 'loaded',
                    data: { blockHeight: 0, blockTime: 0, minFee: 100, maxFee: 100, levels: [] },
                },
            },
            send: {
                drafts: {
                    [account.key]: {
                        isDestinationTagEnabled: false,
                        outputs: [
                            {
                                type: 'payment',
                                address: 'GDESTINATION',
                                amount: '1',
                                fiat: '',
                                currency: { value: 'usd', label: 'USD' },
                                token: null,
                            },
                        ],
                    },
                },
                feeLevels: { normal: finalTransaction },
            },
        },
    });
    const { actions, dispatch } = createMockDispatch({
        getState: store.getState,
        extra: undefined,
    });

    const { result } = await renderHookWithStoreProvider(
        () => {
            const sendForm = useSendForm(account.key);

            // formState is a proxy that only updates the fields read during render.
            return {
                handleSubmitSendForm: sendForm?.handleSubmitSendForm,
                isSubmitting: sendForm?.form.formState.isSubmitting,
            };
        },
        {
            services: {
                store: { ...store, dispatch },
                networks: {
                    addressValidator: { isAddressValid: () => true },
                    getNamedAddressSupport: () => ({ isSupported: false, isNameLike: () => false }),
                },
            },
        },
    );

    return { result, actions };
};

describe('useSendForm Stellar submit', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('keeps the form submitting until the signing request settles', async () => {
        const signing = createDeferred<unknown>();
        mockSigningThunk.mockReturnValue(signing.promise);
        const { result, actions } = await renderUseSendForm();

        // The submit is not awaited: it stays pending until signing settles, which is what is under test.
        await act(() => {
            void result.current.handleSubmitSendForm?.();
        });
        await waitFor(() => expect(mockSigningThunk).toHaveBeenCalledTimes(1));
        expect(signTransactionNativeThunk).toHaveBeenCalledWith({
            accountKey: account.key,
            tokenContract: undefined,
            feeLevel: finalTransaction,
        });
        expect(mockNavigation.navigate).toHaveBeenCalledWith(
            RootStackRoutes.AuthorizeDeviceStack,
            expect.objectContaining({ screen: AuthorizeDeviceStackRoutes.DeviceConnectionGuard }),
        );
        expect(result.current.isSubmitting).toBe(true);

        await act(async () => {
            signing.resolve({
                type: 'signTransaction/fulfilled',
                meta: { requestId: 'signing', requestStatus: 'fulfilled' },
            });
            await signing.promise;
        });
        await waitFor(() => expect(result.current.isSubmitting).toBe(false));
        expect(actions).not.toContainEqual(sendFormActions.discardTransaction());
    });

    it('ends the submission when the signing is cancelled', async () => {
        const signing = createDeferred<unknown>();
        mockSigningThunk.mockReturnValue(signing.promise);
        const { result } = await renderUseSendForm();

        // The submit is not awaited: it stays pending until signing settles, which is what is under test.
        await act(() => {
            void result.current.handleSubmitSendForm?.();
        });
        await waitFor(() => expect(result.current.isSubmitting).toBe(true));

        await act(async () => {
            signing.resolve({
                type: 'signTransaction/rejected',
                meta: { requestId: 'signing', requestStatus: 'rejected' },
                payload: { errorCode: 'Method_Cancel' },
            });
            await signing.promise;
        });
        await waitFor(() => expect(result.current.isSubmitting).toBe(false));
        expect(mockNavigation.popTo).toHaveBeenCalledWith(SendStackRoutes.SendOutputs, {
            accountKey: account.key,
            tokenContract: undefined,
        });
    });
});
