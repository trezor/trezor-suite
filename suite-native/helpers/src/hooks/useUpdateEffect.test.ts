import { type EffectCallback } from 'react';

import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useUpdateEffect } from './useUpdateEffect';

describe('useUpdateEffect', () => {
    const renderUseUpdateEffect = async (initialEffect: EffectCallback) =>
        await renderHookWithBasicProvider(({ effect }) => useUpdateEffect(effect), {
            initialProps: { effect: initialEffect },
        });

    it('should do nothing on mount', async () => {
        const effect = jest.fn();
        await renderUseUpdateEffect(effect);

        expect(effect).not.toHaveBeenCalled();
    });

    it('should call effect on update', async () => {
        const effect = jest.fn();
        const { rerender } = await renderUseUpdateEffect(jest.fn());

        await rerender({ effect });

        expect(effect).toHaveBeenCalledTimes(1);
    });

    it('should call dispose callback on unmount', async () => {
        const dispose = jest.fn();
        const effect = () => dispose;
        const { rerender, unmount } = await renderUseUpdateEffect(jest.fn());

        await rerender({ effect });
        await unmount();

        expect(dispose).toHaveBeenCalledTimes(1);
    });
});
