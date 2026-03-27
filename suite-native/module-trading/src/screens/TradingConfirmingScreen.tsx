import { Screen, type TradingStackRoutes } from '@suite-native/navigation';
import type { ConfirmationVariant } from '@suite-native/trading-types';

import { ExchangeConfirmationHeader } from '../components/exchange/Confirmation/ExchangeConfirmationHeader';
import { ExchangeConfirmationInfo } from '../components/exchange/Confirmation/ExchangeConfirmationInfo';
import { ExchangeConfirmationTitle } from '../components/exchange/Confirmation/ExchangeConfirmationTitle';
import { ExploreInBlockchainButton } from '../components/exchange/Confirmation/ExploreInBlockchainButton';
import { TradingDeviceConnectionGuard } from '../components/general/TradingDeviceConnectionGuard';

// TODO 25742 this should be in route params, not as a prop
export type TradingConfirmingScreenProps = {
    variant: ConfirmationVariant;
    continueOn: TradingStackRoutes;
};

export const TradingConfirmingScreen = ({ variant }: TradingConfirmingScreenProps) => (
    <TradingDeviceConnectionGuard>
        <Screen header={<ExchangeConfirmationHeader variant={variant} />}>
            <ExchangeConfirmationTitle variant={variant} />
            <ExchangeConfirmationInfo variant={variant} />
            <ExploreInBlockchainButton />
        </Screen>
    </TradingDeviceConnectionGuard>
);
