import { Text } from '@suite-native/atoms';
import { renderWithProviders } from '@suite-native/test-utils';

import { SlidingFooterOverlay } from '../SlidingFooterOverlay';

describe('SlidingFooterOverlay', () => {
    it('should render children', () => {
        const { getByText, getByTestId } = renderWithProviders(
            <SlidingFooterOverlay activeStepOffset={123}>
                <Text>CHILDREN</Text>
            </SlidingFooterOverlay>,
            { providers: ['intl'] },
        );

        expect(getByText('CHILDREN')).toBeOnTheScreen();
        expect(getByTestId('sliding-footer-overlay')).toHaveStyle({
            transform: [{ translateY: 123 }],
        });
    });

    it('should render without children', () => {
        const { getByTestId } = renderWithProviders(
            <SlidingFooterOverlay activeStepOffset={321} />,
            { providers: ['intl'] },
        );

        expect(getByTestId('sliding-footer-overlay')).toHaveStyle({
            transform: [{ translateY: 321 }],
        });
    });
});
