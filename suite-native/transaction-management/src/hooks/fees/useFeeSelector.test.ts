import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useFeeSelector } from './useFeeSelector';
import { createFeeLevel } from '../../__fixtures__/feeLevels';
import { ETH_ACCOUNT_KEY, getWalletState } from '../../__fixtures__/walletState';

jest.mock('./useFeesFetching', () => ({ useFeesFetching: () => ({ areFeesLoading: false }) }));
jest.mock('@suite-native/atoms', () => ({
    ...jest.requireActual('@suite-native/atoms'),
    useBottomSheetModal: () => ({
        bottomSheetRef: { current: null },
        openModal: jest.fn(),
        closeModal: jest.fn(),
    }),
}));

it('displays the confirmed fee when an amount edit resets the draft while the picker still holds High', async () => {
    const wallet = getWalletState();
    const { result, rerender } = await renderHookWithStoreProvider(useFeeSelector, {
        initialProps: {
            accountKey: ETH_ACCOUNT_KEY,
            selectedFee: 'high' as 'high' | 'normal',
            updateThunk: () => () => undefined,
            formDraft: null,
        },
        preloadedState: {
            wallet: {
                ...wallet,
                send: {
                    ...wallet.send,
                    feeLevels: {
                        normal: createFeeLevel({ fee: '21000000000000' }),
                        high: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' },
                    },
                },
            },
        },
    });
    expect(result.current.shouldShowFeeUnavailableAlert).toBe(true);
    await rerender({
        accountKey: ETH_ACCOUNT_KEY,
        selectedFee: 'normal',
        updateThunk: () => () => undefined,
        formDraft: null,
    });
    expect(result.current.form.getValues('feeLevel')).toBe('high');
    expect(result.current.shouldShowFeeUnavailableAlert).toBe(false);
    expect(result.current.fee).toBe('21000000000000');
    await act(() => result.current.handleOpen());
    expect(result.current.form.getValues('feeLevel')).toBe('normal');
});
