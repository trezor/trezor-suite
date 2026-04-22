import { renderWithProviders } from '@suite-native/test-utils';

import { ExchangeFusionPlusInfo } from '../ExchangeFusionPlusInfo';

describe('ExchangeFusionPlusInfo', () => {
    it('should render the Fusion+ card with header', () => {
        const { getByText } = renderWithProviders(<ExchangeFusionPlusInfo />, {
            providers: ['intl'],
        });

        expect(getByText('You are swapping with 1Inch Fusion+')).toBeOnTheScreen();
    });

    it('should render all three bullet points', () => {
        const { getByText } = renderWithProviders(<ExchangeFusionPlusInfo />, {
            providers: ['intl'],
        });

        expect(
            getByText('Simply sign the order - no need to send transactions manually'),
        ).toBeOnTheScreen();
        expect(
            getByText('No gas fees - the smart contract handles everything for you'),
        ).toBeOnTheScreen();
        expect(
            getByText('Your swap might be partially filled based on the market conditions'),
        ).toBeOnTheScreen();
    });
});
