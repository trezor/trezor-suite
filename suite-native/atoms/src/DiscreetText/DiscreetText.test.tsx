import { View } from 'react-native';

import { renderWithBasicProvider } from '@suite-native/test-utils';

import { Box as MockBox } from '../Box';
import { DiscreetText } from './DiscreetText';

jest.mock('@suite-common/discreet-mode', () => ({
    useDiscreetMode: () => ({
        isDiscreetMode: false,
        setIsDiscreetMode: jest.fn(),
    }),
}));

jest.mock('./DiscreetCanvas', () => ({
    DiscreetCanvas: () => <MockBox testID="discreet-canvas" />,
}));

describe('DiscreetText', () => {
    it('should render the canvas without reacting to text layout changes', () => {
        const { getByTestId, UNSAFE_getAllByType } = renderWithBasicProvider(
            <DiscreetText isForcedDiscreetMode>Hidden amount</DiscreetText>,
        );

        const hasLayoutHandler = UNSAFE_getAllByType(View).some(
            view => typeof view.props.onLayout === 'function',
        );

        expect(getByTestId('discreet-text')).toBeOnTheScreen();
        expect(getByTestId('discreet-canvas')).toBeOnTheScreen();
        expect(hasLayoutHandler).toBe(false);
    });
});
