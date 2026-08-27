import { View as MockView, type ViewProps } from 'react-native';

import { renderWithBasicProvider } from '@suite-native/test-utils';

import { DiscreetCanvas } from './DiscreetCanvas';

jest.mock('@shopify/react-native-skia', () => ({
    Blur: () => null,
    Canvas: (props: ViewProps) => <MockView {...props} testID="discreet-canvas" />,
    Text: () => null,
}));

jest.mock('./useDiscreetFont', () => ({
    useDiscreetFont: () => ({}),
}));

jest.unmock('./DiscreetCanvas');

describe('DiscreetCanvas', () => {
    it('should fill its parent without defining its own dimensions', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <DiscreetCanvas fontSize={16} lineHeight={24} text="$100" color="contentPrimary" />,
        );

        expect(getByTestId('discreet-canvas')).toHaveStyle({
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            borderRadius: 12,
        });
    });
});
