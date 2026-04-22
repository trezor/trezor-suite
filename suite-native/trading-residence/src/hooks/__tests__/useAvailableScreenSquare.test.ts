import type { LayoutChangeEvent } from 'react-native';

import { act, renderHookWithProviders } from '@suite-native/test-utils';

import {
    HEADER_HEIGHT,
    HORIZONTAL_MARGIN,
    useAvailableScreenSquare,
} from '../useAvailableScreenSquare';

// useWindowDimensions returns { width: 750, height: 1334 } by default in jest-expo
const MOCKED_SCREEN_HEIGHT = 1334;
const MOCKED_SCREEN_WIDTH = 750;

const MINIMUM_SIZE = 50;
const MAXIMUM_SIZE = 300;

describe('useAvailableScreenSquare', () => {
    const mockLayoutEvent = (height: number, width: number = 0): LayoutChangeEvent =>
        ({
            nativeEvent: { layout: { height, width, x: 0, y: 0 } },
        }) as LayoutChangeEvent;

    const renderUseAvailableScreenSpace = (maximumSize = MAXIMUM_SIZE) =>
        renderHookWithProviders(() => useAvailableScreenSquare(MINIMUM_SIZE, maximumSize), {
            providers: ['intl'],
        });

    it('should return MAXIMUM_SIZE when totalAvailableHeight is larger than MAXIMUM_SIZE', () => {
        // totalAvailableHeight = 1334 - 100 = 1234 which is > MAXIMUM_SIZE = 300

        const { result } = renderUseAvailableScreenSpace();

        expect(result.current.squareSize).toBe(MAXIMUM_SIZE);
    });

    it('should return total available height when it is between MINIMUM_SIZE and MAXIMUM_SIZE', () => {
        // contentHeight = 1000 => totalAvailableHeight = 1334 - 100 - 1000 = 234
        // 234 > 50 (MINIMUM_SIZE) && 234 < 300 (MAXIMUM_SIZE)
        const contentHeight = 1000;

        const { result } = renderUseAvailableScreenSpace();

        act(() => {
            result.current.handleContentLayout(mockLayoutEvent(contentHeight));
        });

        const expectedHeight = MOCKED_SCREEN_HEIGHT - contentHeight - HEADER_HEIGHT;

        expect(result.current.squareSize).toBe(expectedHeight);
    });

    it('should return MINIMUM_SIZE when totalAvailableHeight is below MINIMUM_SIZE', () => {
        // contentHeight = 1185 => totalAvailableHeight = 1334 - 100 - 1185 = 49 which is < 50 (MINIMUM_SIZE)
        const contentHeight = 1185;

        const { result } = renderUseAvailableScreenSpace();

        act(() => {
            result.current.handleContentLayout(mockLayoutEvent(contentHeight));
        });

        expect(result.current.squareSize).toBe(MINIMUM_SIZE);
    });

    it('should cap squareSize to totalAvailableWidth when height exceeds it', () => {
        // MAXIMUM_SIZE = 800 > totalAvailableWidth = 730 => squareSize should be 730
        const { result } = renderUseAvailableScreenSpace(800);

        expect(result.current.squareSize).toBe(MOCKED_SCREEN_WIDTH - HORIZONTAL_MARGIN);
    });
});
