import { useForm } from 'react-hook-form';

import { act, renderHook } from '@testing-library/react';

import { type YieldFlowFormValues } from '@suite-common/wallet-core';

import { useYieldFiatInput } from './useYieldFiatInput';

const ETH_RATE = 3333.35;

const mockState = {
    wallet: {
        settings: { localCurrency: 'usd' },
        fiat: { current: { 'eth-usd': { rate: ETH_RATE } } },
    },
};

jest.mock('src/hooks/suite', () => ({
    useSelector: (selector: (state: unknown) => unknown) => selector(mockState),
}));

const renderYieldFiatInput = () =>
    renderHook(() => {
        const methods = useForm<YieldFlowFormValues>({
            mode: 'onChange',
            defaultValues: { amountInput: '', fiatInput: '' },
        });

        return { methods, fiat: useYieldFiatInput({ methods, symbol: 'eth', decimals: 18 }) };
    });

describe('useYieldFiatInput', () => {
    it('offers the fiat switch when a rate is available', () => {
        const { result } = renderYieldFiatInput();

        expect(result.current.fiat.fiatToggle).toBeDefined();
        expect(result.current.fiat.fiatToggle?.currency).toBe('crypto');
        expect(result.current.fiat.fiatToggle?.fiatSymbol).toBe('USD');
    });

    it('keeps Max in crypto units when crypto is the active input', () => {
        const { result } = renderYieldFiatInput();

        act(() => result.current.fiat.setMaxAmount('0.1'));

        expect(result.current.methods.getValues('amountInput')).toBe('0.1');
    });

    // The Max button must fill the active unit rather than switching back to crypto.
    it('fills the rounded-down fiat max when fiat is the active input, without switching', () => {
        const { result } = renderYieldFiatInput();

        act(() => result.current.fiat.fiatToggle?.onToggle());
        expect(result.current.fiat.fiatToggle?.currency).toBe('fiat');

        act(() => result.current.fiat.setMaxAmount('0.1'));

        // Stays in fiat, shows the floored fiat max, and keeps the exact crypto max underneath.
        expect(result.current.fiat.fiatToggle?.currency).toBe('fiat');
        expect(result.current.methods.getValues('fiatInput')).toBe('333.33');
        expect(result.current.methods.getValues('amountInput')).toBe('0.1');
    });

    it('converts a typed fiat amount into the crypto source of truth', () => {
        const { result } = renderYieldFiatInput();

        act(() => result.current.fiat.fiatToggle?.onToggle());
        act(() => result.current.fiat.fiatToggle?.onFiatAmountChange('333.33'));

        expect(result.current.methods.getValues('amountInput')).toBe('0.099998500007499963');
    });
});
