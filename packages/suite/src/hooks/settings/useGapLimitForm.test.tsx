import { act } from '@testing-library/react';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { blockchainActions } from '@suite-common/wallet-core';

import { useGapLimitForm } from './useGapLimitForm';

const SYMBOL = 'btc';

const renderGapLimitForm = (savedGapLimit?: number) => {
    const store = configureMockStore({
        preloadedState: {
            wallet: {
                blockchain: {
                    [SYMBOL]: { backends: { gapLimit: savedGapLimit } },
                },
            },
        },
    });
    const { result } = renderHookWithStoreProvider(() => useGapLimitForm(SYMBOL), { store });

    return { store, result };
};

const gapLimitActions = (store: ReturnType<typeof renderGapLimitForm>['store']) =>
    store.getActions().filter(action => action.type === blockchainActions.setBackendGapLimit.type);

describe('useGapLimitForm', () => {
    it('persists a valid gap limit', () => {
        const { store, result } = renderGapLimitForm();

        act(() => result.current.setValue('30'));
        act(() => result.current.save());

        expect(gapLimitActions(store)).toEqual([
            blockchainActions.setBackendGapLimit({ symbol: SYMBOL, gapLimit: 30 }),
        ]);
    });

    it('does not persist a gap limit below the minimum despite the button click', () => {
        const { store, result } = renderGapLimitForm();

        act(() => result.current.setValue('5'));

        expect(result.current.error?.id).toBe('TR_GAP_LIMIT_ERROR_TOO_LOW');

        act(() => result.current.save());

        expect(gapLimitActions(store)).toEqual([]);
    });

    it('does not persist an empty or non-positive gap limit', () => {
        const { store, result } = renderGapLimitForm();

        act(() => result.current.setValue(''));
        act(() => result.current.save());

        act(() => result.current.setValue('0'));
        act(() => result.current.save());

        expect(gapLimitActions(store)).toEqual([]);
    });
});
