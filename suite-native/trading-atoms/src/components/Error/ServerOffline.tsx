import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { WarningCard } from './WarningCard';

export type ServerOfflineProps = {
    onRetryPress: () => void;
};

export const ServerOffline = ({ onRetryPress }: ServerOfflineProps) => (
    <WarningCard
        title={<Translation id="tradingAtoms.error.serverOfflineTitle" />}
        description={<Translation id="tradingAtoms.error.serverOfflineDescription" />}
    >
        <Button
            intent="neutral"
            priority="secondary"
            onPress={onRetryPress}
            iconLeft="arrowsCounterClockwise"
        >
            <Translation id="tradingAtoms.error.serverOfflineRetry" />
        </Button>
    </WarningCard>
);
