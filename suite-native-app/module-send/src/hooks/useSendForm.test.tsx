import { type Store } from '@reduxjs/toolkit';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { AuthorizeDeviceStackRoutes, RootStackRoutes } from '@suite-native/navigation';
import { type SignSendFormTransaction, signTransactionNativeThunk } from '@suite-native/send';
import {
    act,
    createStoreFromPreloadedState,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';
import { createDeferred } from '@trezor/utils';

import { useSendForm } from './useSendForm';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
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

// The form's fee and compose thunks call Trezor Connect directly, so they are left unexecuted.
const dispatch: Store['dispatch'] = action => action;

const renderUseSendForm = (signSendFormTransaction: SignSendFormTransaction) => {
    const store = createStoreFromPreloadedState({
        analytics: { instanceId: undefined },
        messageSystem: { config: null, validExperiments: [], experimentInclusionOverrides: {} },
        device: { devices: [], selectedDevice: undefined },
        wallet: {
            accounts: [account],
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

    return renderHookWithStoreProvider(
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
                signSendFormTransaction,
            },
        },
    );
};

describe('useSendForm Stellar submit', () => {
    it('keeps the form submitting until the signing request settles', async () => {
        const signing = createDeferred<Awaited<ReturnType<SignSendFormTransaction>>>();
        const signSendFormTransaction = mock<SignSendFormTransaction>(() => signing.promise);
        const signingParams = { accountKey: account.key, feeLevel: finalTransaction };
        const { result } = await renderUseSendForm(signSendFormTransaction);

        await act(() => {
            result.current.handleSubmitSendForm?.();
        });
        await waitFor(() => expect(signSendFormTransaction).toHaveBeenCalledTimes(1));
        expect(signSendFormTransaction).toHaveBeenCalledWith({
            ...signingParams,
            tokenContract: undefined,
        });
        expect(mockNavigate).toHaveBeenCalledWith(
            RootStackRoutes.AuthorizeDeviceStack,
            expect.objectContaining({ screen: AuthorizeDeviceStackRoutes.DeviceConnectionGuard }),
        );
        expect(result.current.isSubmitting).toBe(true);

        await act(async () => {
            signing.resolve(
                signTransactionNativeThunk.fulfilled(undefined, 'requestId', signingParams),
            );
            await signing.promise;
        });
        expect(result.current.isSubmitting).toBe(false);
    });
});
