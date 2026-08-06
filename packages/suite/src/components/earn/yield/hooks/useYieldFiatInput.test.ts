import { useForm } from 'react-hook-form';

import { act, renderHook } from '@testing-library/react';

import { events } from '@suite-common/analytics';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type YieldFlowFormValues } from '@suite-common/wallet-core';

import { useYieldFiatInput } from './useYieldFiatInput';

const ETH_RATE = 3333.35;
const ethSymbol = asNetworkSymbol('eth');

const mockState = {
    wallet: {
        settings: { localCurrency: 'usd' },
        fiat: { current: { 'eth-usd': { rate: ETH_RATE } } },
    },
};

const mockReport = jest.fn();

jest.mock('src/hooks/suite', () => ({
    useSelector: (selector: (state: unknown) => unknown) => selector(mockState),
}));

jest.mock('@suite-common/dependency-injection', () => {
    const analytics = { report: (...args: unknown[]) => mockReport(...args) };

    return { useServices: () => ({ analytics }) };
});

jest.mock('@suite/analytics', () => ({ selectDesktopAnalyticsDep: () => ({}) }));

const renderYieldFiatInput = (vaultId?: string) =>
    renderHook(() => {
        const methods = useForm<YieldFlowFormValues>({
            mode: 'onChange',
            defaultValues: { amountInput: '', fiatInput: '' },
        });

        return {
            methods,
            fiat: useYieldFiatInput({ methods, symbol: ethSymbol, decimals: 18, vaultId }),
        };
    });

describe('useYieldFiatInput', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

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

    it('reports the unit switched to, in both directions', () => {
        const { result } = renderYieldFiatInput();

        act(() => result.current.fiat.fiatToggle?.onToggle());
        act(() => result.current.fiat.fiatToggle?.onToggle());

        expect(mockReport.mock.calls.map(([event]) => event.payload.value)).toEqual([
            'fiat',
            'crypto',
        ]);
        expect(mockReport).toHaveBeenCalledWith({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'amount-currency-toggle',
                value: 'fiat',
                networkSymbol: 'eth',
                vaultId: undefined,
            },
        });
    });

    it('carries the vault id when the amount belongs to a vault flow', () => {
        const { result } = renderYieldFiatInput('morpho-weth');

        act(() => result.current.fiat.fiatToggle?.onToggle());

        expect(mockReport).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({ vaultId: 'morpho-weth' }),
            }),
        );
    });
});
