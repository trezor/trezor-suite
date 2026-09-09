import { type UnknownAction } from '@reduxjs/toolkit';
import { act } from '@testing-library/react';

import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { blockchainActions } from '@suite-common/wallet-core';

import { useGapLimitForm } from './useGapLimitForm';

const SYMBOL = asNetworkSymbol('btc');

const renderGapLimitForm = (savedGapLimit?: number) => {
    const root = createTestCompositionRoot({
        preloadedState: {
            wallet: {
                blockchain: {
                    [SYMBOL]: { backends: { gapLimit: savedGapLimit } },
                },
            },
        },
    });
    const { result } = renderHookWithStoreProvider(() => useGapLimitForm(SYMBOL), { root });

    const { getActions } = root.services;

    return { getActions, result };
};

const gapLimitActions = (actions: UnknownAction[]) =>
    actions.filter(action => action.type === blockchainActions.setBackendGapLimit.type);

describe('useGapLimitForm', () => {
    it('persists a valid gap limit', () => {
        const { getActions, result } = renderGapLimitForm();

        act(() => result.current.setValue('30'));
        act(() => result.current.save());

        expect(gapLimitActions(getActions())).toEqual([
            blockchainActions.setBackendGapLimit({ symbol: SYMBOL, gapLimit: 30 }),
        ]);
    });

    it('does not persist a gap limit below the minimum despite the button click', () => {
        const { getActions, result } = renderGapLimitForm();

        act(() => result.current.setValue('5'));

        expect(result.current.error?.id).toBe('TR_GAP_LIMIT_ERROR_TOO_LOW');

        act(() => result.current.save());

        expect(gapLimitActions(getActions())).toEqual([]);
    });

    it('does not persist an empty or non-positive gap limit', () => {
        const { getActions, result } = renderGapLimitForm();

        act(() => result.current.setValue(''));
        act(() => result.current.save());

        act(() => result.current.setValue('0'));
        act(() => result.current.save());

        expect(gapLimitActions(getActions())).toEqual([]);
    });
});
