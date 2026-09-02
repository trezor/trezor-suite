import { Text } from '@suite-native/atoms';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { SlidingFooterOverlay } from './SlidingFooterOverlay';

describe('SlidingFooterOverlay', () => {
    it('should render children', async () => {
        const { getByText, getByTestId } = await renderWithBasicProvider(
            <SlidingFooterOverlay activeStepOffset={123}>
                <Text>CHILDREN</Text>
            </SlidingFooterOverlay>,
        );

        expect(getByText('CHILDREN')).toBeOnTheScreen();
        expect(getByTestId('sliding-footer-overlay')).toHaveStyle({
            transform: [{ translateY: 123 }],
        });
    });

    it('should render without children', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <SlidingFooterOverlay activeStepOffset={321} />,
        );

        expect(getByTestId('sliding-footer-overlay')).toHaveStyle({
            transform: [{ translateY: 321 }],
        });
    });
});
