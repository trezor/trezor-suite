import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { WarningCard } from './WarningCard';

export type ServerOfflineProps = {
    onRetryPress: () => void;
};

export const ServerOffline = ({ onRetryPress }: ServerOfflineProps) => (
    <WarningCard
        title={<Translation id="moduleTrading.error.serverOfflineTitle" />}
        description={<Translation id="moduleTrading.error.serverOfflineDescription" />}
    >
        <Button
            colorScheme="tertiaryElevation0"
            onPress={onRetryPress}
            viewLeft="arrowsCounterClockwise"
        >
            <Translation id="moduleTrading.error.serverOfflineRetry" />
        </Button>
    </WarningCard>
);
