import { type UnknownAction } from '@reduxjs/toolkit';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import {
    act,
    createStoreFromPreloadedState,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';

import { useSendForm } from './useSendForm';

const mockSigningThunk = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: jest.fn(), popTo: jest.fn() }),
}));
jest.mock('@suite-native/send', () => ({
    signTransactionNativeThunk: () => mockSigningThunk,
}));
jest.mock('@suite-common/message-system', () => ({
    ...jest.requireActual('@suite-common/message-system'),
    useIsExperimentVariantActive: () => false,
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    useResolveNamedAddress: () => ({ mode: undefined, isResolving: false }),
}));
jest.mock('../sendOutputsFormSchema', () => ({
    sendOutputsFormValidationSchema: jest.requireActual('yup').object(),
}));
jest.mock('./useRequestDelayedNavigationToOutputsReview', () => ({
    useRequestDelayedNavigationToOutputsReview: () => jest.fn(),
}));
jest.mock('./useShowDeviceDisconnectedAlert', () => ({
    useShowDeviceDisconnectedAlert: () => jest.fn(),
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('xlm') });
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
        device: { devices: [], selectedDevice: undefined },
        wallet: {
            accounts: [account],
            fees: {
                xlm: {
                    status: 'loaded',
                    data: { blockHeight: 0, blockTime: 0, minFee: 100, maxFee: 100, levels: [] },
                },
            },
            send: { drafts: {}, feeLevels: { normal: finalTransaction } },
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
                    addressValidator: () => true,
                    getNamedAddressSupport: () => undefined,
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

        await act(async () => {
            result.current.handleSubmitSendForm?.();
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        expect(mockSigningThunk).toHaveBeenCalledTimes(1);
        expect(result.current.isSubmitting).toBe(true);

        await act(async () => {
            resolveSigning({ type: 'signTransaction/fulfilled', meta: {} });
            await signingResult;
        });
        expect(result.current.isSubmitting).toBe(false);
    });
});
