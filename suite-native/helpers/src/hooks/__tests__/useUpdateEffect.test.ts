import { type EffectCallback } from 'react';

import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useUpdateEffect } from '../useUpdateEffect';

describe('useUpdateEffect', () => {
    const renderUseUpdateEffect = (initialEffect: EffectCallback) =>
        renderHookWithBasicProvider(({ effect }) => useUpdateEffect(effect), {
            initialProps: { effect: initialEffect },
        });

    it('should do nothing on mount', () => {
        const effect = jest.fn();
        renderUseUpdateEffect(effect);

        expect(effect).not.toHaveBeenCalled();
    });

    it('should call effect on update', () => {
        const effect = jest.fn();
        const { rerender } = renderUseUpdateEffect(jest.fn());

        rerender({ effect });

        expect(effect).toHaveBeenCalledTimes(1);
    });

    it('should call dispose callback on unmount', () => {
        const dispose = jest.fn();
        const effect = () => dispose;
        const { rerender, unmount } = renderUseUpdateEffect(jest.fn());

        rerender({ effect });
        unmount();

        expect(dispose).toHaveBeenCalledTimes(1);
    });
});
