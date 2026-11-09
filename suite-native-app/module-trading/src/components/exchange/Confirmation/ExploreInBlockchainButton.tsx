import { LinearTransition } from 'react-native-reanimated';

import { AnimatedBox, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type ExploreInBlockchainButtonProps = {
    onPress: () => void;
};

export const ExploreInBlockchainButton = ({ onPress }: ExploreInBlockchainButtonProps) => (
    <AnimatedBox layout={LinearTransition}>
        <Button onPress={onPress} iconRight="arrowUpRight" intent="neutral" priority="secondary">
            <Translation id="moduleTrading.tradingConfirmationScreen.exploreInBlockchain" />
        </Button>
    </AnimatedBox>
);
