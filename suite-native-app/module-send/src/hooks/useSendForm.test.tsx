import { type UnknownAction } from '@reduxjs/toolkit';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { AuthorizeDeviceStackRoutes, RootStackRoutes } from '@suite-native/navigation';
import {
    act,
    createStoreFromPreloadedState,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-native/test-utils-store';

import { useSendForm } from './useSendForm';

const mockSigningThunk = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock('@suite-native/send', () => ({
    signTransactionNativeThunk: () => mockSigningThunk,
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

const renderUseSendForm = (signingResult: Promise<unknown>) => {
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
    mockSigningThunk.mockReturnValue(signingResult);
    // Only the signing thunk matters here; fee and max amount thunks are not under test.
    const dispatch = (action: UnknownAction | typeof mockSigningThunk) =>
        action === mockSigningThunk ? mockSigningThunk() : Promise.resolve(action);

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
            },
        },
    );
};

describe('useSendForm Stellar submit', () => {
    it('keeps the form submitting until the signing request settles', async () => {
        let resolveSigning: (value: unknown) => void = () => {};
        const signingResult = new Promise(resolve => {
            resolveSigning = resolve;
        });
        const { result } = await renderUseSendForm(signingResult);

        // The submit is not awaited: it stays pending until signing settles, which is what is under test.
        await act(() => {
            void result.current.handleSubmitSendForm?.();
        });
        await waitFor(() => expect(mockSigningThunk).toHaveBeenCalledTimes(1));
        expect(mockNavigate).toHaveBeenCalledWith(
            RootStackRoutes.AuthorizeDeviceStack,
            expect.objectContaining({ screen: AuthorizeDeviceStackRoutes.DeviceConnectionGuard }),
        );
        expect(result.current.isSubmitting).toBe(true);

        await act(async () => {
            resolveSigning({ type: 'signTransaction/fulfilled', meta: {} });
            await signingResult;
        });
        expect(result.current.isSubmitting).toBe(false);
    });
});
