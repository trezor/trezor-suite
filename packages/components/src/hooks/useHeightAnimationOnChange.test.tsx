import { render } from '@testing-library/react';

import { useHeightAnimationOnChange } from './useHeightAnimationOnChange';

type TestElementProps = {
    trigger: number;
    isDisabled?: boolean;
};

const TestElement = ({ trigger, isDisabled }: TestElementProps) => {
    const elementRef = useHeightAnimationOnChange({ trigger, isDisabled });

    return <div ref={elementRef} />;
};

const animate = jest.fn();
const supports = jest.fn((_property: string, _value: string) => true);
let reportLaidOutHeight: (height: number) => void = () => {};

class MockResizeObserver implements ResizeObserver {
    constructor(callback: ResizeObserverCallback) {
        reportLaidOutHeight = height =>
            callback([{ contentRect: { height } } as ResizeObserverEntry], this);
    }

    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
}

describe('useHeightAnimationOnChange', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        supports.mockReturnValue(true);
        global.ResizeObserver = MockResizeObserver;
        HTMLElement.prototype.animate = animate;
        Object.defineProperty(window, 'CSS', { value: { supports }, configurable: true });
    });

    it('animates from the last laid-out height to the new auto height when the trigger changes', () => {
        const { rerender } = render(<TestElement trigger={1} />);
        reportLaidOutHeight(244);

        rerender(<TestElement trigger={2} />);

        expect(supports).toHaveBeenCalledWith('height', 'calc-size(auto, size)');
        expect(animate).toHaveBeenCalledTimes(1);
        expect(animate).toHaveBeenCalledWith(
            [{ height: '244px' }, { height: 'calc-size(auto, size)' }],
            expect.objectContaining({ duration: 200 }),
        );
    });

    it('does not animate on mount or on a re-render with the same trigger', () => {
        const { rerender } = render(<TestElement trigger={1} />);
        reportLaidOutHeight(244);

        rerender(<TestElement trigger={1} />);

        expect(animate).not.toHaveBeenCalled();
    });

    it('does not animate before the element has been laid out', () => {
        const { rerender } = render(<TestElement trigger={1} />);

        rerender(<TestElement trigger={2} />);

        expect(animate).not.toHaveBeenCalled();
    });

    it('does not animate a change made while disabled, nor when it gets enabled', () => {
        const { rerender } = render(<TestElement trigger={0} isDisabled />);
        reportLaidOutHeight(148);

        rerender(<TestElement trigger={1} isDisabled />);
        rerender(<TestElement trigger={1} isDisabled={false} />);

        expect(animate).not.toHaveBeenCalled();

        reportLaidOutHeight(244);
        rerender(<TestElement trigger={2} isDisabled={false} />);

        expect(animate).toHaveBeenCalledTimes(1);
        expect(animate.mock.calls[0][0]).toEqual([
            { height: '244px' },
            { height: 'calc-size(auto, size)' },
        ]);
    });

    it('resizes instantly in browsers without calc-size()', () => {
        supports.mockReturnValue(false);
        const { rerender } = render(<TestElement trigger={1} />);
        reportLaidOutHeight(244);

        rerender(<TestElement trigger={2} />);

        expect(animate).not.toHaveBeenCalled();
    });
});
