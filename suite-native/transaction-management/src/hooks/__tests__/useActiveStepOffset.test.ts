import { type LayoutChangeEvent } from 'react-native';

import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useActiveStepOffset } from '../useActiveStepOffset';

describe('useActiveStepOffset', () => {
    const getLayoutEvent = (height: number) =>
        ({ nativeEvent: { layout: { height } } }) as LayoutChangeEvent;

    const renderUseReviewOutputItemListHeights = (initialActiveStep: number) =>
        renderHookWithBasicProvider(({ activeStep }) => useActiveStepOffset(activeStep), {
            initialProps: { activeStep: initialActiveStep },
        });

    it('should return 0 on initial render', () => {
        const { result } = renderUseReviewOutputItemListHeights(0);

        expect(result.current.activeStepBottomOffset).toEqual(0);
    });

    it('should use heights from layout events to compute offset to bottom of active item', () => {
        const { result } = renderUseReviewOutputItemListHeights(1);

        act(() => {
            result.current.handleReadListItemHeight(getLayoutEvent(100), 0);
        });
        act(() => {
            result.current.handleReadListItemHeight(getLayoutEvent(200), 1);
        });
        act(() => {
            result.current.handleReadListItemHeight(getLayoutEvent(300), 2);
        });
        // rewrite already set height for index 1
        act(() => {
            result.current.handleReadListItemHeight(getLayoutEvent(150), 1);
        });

        // offset should be item 0 height (spacing included) + item 1 height (spacing included)
        expect(result.current.activeStepBottomOffset).toEqual(116 + 166);
    });
});
