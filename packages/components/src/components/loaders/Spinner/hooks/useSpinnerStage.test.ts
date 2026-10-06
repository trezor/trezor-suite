import { act, renderHook } from '@testing-library/react';

import { useSpinnerStage } from './useSpinnerStage';
import type { SpinnerVariant } from '../types';

type StageProps = { variant: SpinnerVariant };

const renderStage = (initialProps: StageProps) =>
    renderHook(({ variant }: StageProps) => useSpinnerStage({ variant }), { initialProps });

describe('useSpinnerStage', () => {
    it('starts spinning straight away when there is no start animation', () => {
        const { result } = renderStage({ variant: 'loading' });

        expect(result.current.stage).toBe('spinning');
    });

    it('plays the intro first and only then spins', () => {
        const { result } = renderHook(() =>
            useSpinnerStage({ variant: 'loading', hasStartAnimation: true }),
        );

        expect(result.current.stage).toBe('intro');

        act(() => result.current.handleIntroEnd());

        expect(result.current.stage).toBe('spinning');
    });

    it('keeps spinning on a result variant until a full revolution has finished', () => {
        const { result } = renderStage({ variant: 'success' });

        expect(result.current.stage).toBe('spinning');

        act(() => result.current.handleRotationEnd());

        expect(result.current.stage).toBe('settled');
    });

    it('never settles while still loading', () => {
        const { result } = renderStage({ variant: 'loading' });

        act(() => result.current.handleRotationEnd());

        expect(result.current.stage).toBe('spinning');
    });

    it('settles a result variant that arrives after the spinner has been running', () => {
        const { result, rerender } = renderStage({ variant: 'loading' });

        act(() => result.current.handleRotationEnd());
        expect(result.current.stage).toBe('spinning');

        rerender({ variant: 'error' });

        expect(result.current.stage).toBe('settled');
    });
});
