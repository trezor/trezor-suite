import { renderWithBasicProvider } from '@suite-native/test-utils';

import { BridgeSpeedOptionCard } from './BridgeSpeedOptionCard';

describe('BridgeSpeedOptionCard', () => {
    it('should render the coin ticker in the description', async () => {
        const { getByText } = await renderWithBasicProvider(
            <BridgeSpeedOptionCard
                icon="lightning"
                titleId="moduleTrading.bridgeSpeed.fast.title"
                feeId="moduleTrading.bridgeSpeed.fast.fee"
                descriptionId="moduleTrading.bridgeSpeed.fast.description"
                coinSymbol="USDC"
                isChecked={false}
                onChange={jest.fn()}
            />,
        );

        expect(getByText('Bridge sends USDC sooner for a small fee.')).toBeOnTheScreen();
    });
});
