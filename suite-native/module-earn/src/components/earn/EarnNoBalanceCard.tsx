import { type ReactNode } from 'react';

import { isApyAvailable } from '@suite-common/wallet-utils';
import { Badge, Card, CenteredTitleHeader, Pictogram, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useFormattedEarnRate } from '../../hooks/earn/useFormattedEarnRate';

type EarnNoBalanceCardProps = {
    apy: number | null;
    subtitle: ReactNode;
    title: ReactNode;
};

export const EarnNoBalanceCard = ({ apy, subtitle, title }: EarnNoBalanceCardProps) => {
    const formattedApy = useFormattedEarnRate(apy);

    return (
        <Card>
            <VStack alignItems="center" spacing="sp16" paddingVertical="sp16">
                <Pictogram variant="success" icon="coins" />
                <CenteredTitleHeader title={title} subtitle={subtitle} />

                {isApyAvailable(apy) && (
                    <Badge
                        intent="brand"
                        icon="trendUp"
                        label={
                            <Translation
                                id="earn.noBalance.earningApy"
                                values={{ apy: formattedApy }}
                            />
                        }
                    />
                )}
            </VStack>
        </Card>
    );
};
