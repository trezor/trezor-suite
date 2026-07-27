import { selectSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import { ContextMessage } from '@suite/message-system';
import { Context } from '@suite-common/message-system';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, Card, Column, Grid, H3, Paragraph, Tooltip } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

import { DashboardSection } from 'src/components/dashboard';
import { useLayoutSize, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { DiscoveryWarning } from '../DiscoveryWarning';
import { EmptyStakingCardFeature } from './EmptyStakingCardFeature';
import { getNetworkVariant, useStakingCardContent } from './useEmptyStakingCardContent';
import { useEmptyStakingCardData } from './useEmptyStakingCardData';

export const EmptyStakingCard = () => {
    const { isBelowLaptop } = useLayoutSize();
    const account = useSelector(selectSelectedAccount);

    const { stakingMessageContent } = useMessageSystemStaking(account?.symbol);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const variant = getNetworkVariant(account);
    const data = useEmptyStakingCardData({ account });
    const content = useStakingCardContent({ variant, data });

    return (
        <DashboardSection data-testid="@wallet/staking/empty-card">
            <Column gap={16}>
                {isDiscoveryRunning && <DiscoveryWarning />}

                <Card>
                    <Column gap={40}>
                        <Column gap={8}>
                            <H3>{content.title}</H3>

                            <Paragraph intent="neutral" priority="secondary" maxWidth={700}>
                                {content.text}
                            </Paragraph>
                        </Column>

                        <Grid columns={isBelowLaptop ? 1 : 3} gap={24}>
                            {content.features.map(feature => (
                                <EmptyStakingCardFeature key={feature.id} feature={feature} />
                            ))}
                        </Grid>

                        <Tooltip content={stakingMessageContent}>
                            <Button
                                onClick={content.onStartStakingClick}
                                isDisabled={data.isStartStakingDisabled}
                                iconLeft={data.isStartStakingDisabled ? InfoIcon : undefined}
                                data-testid="@wallet/staking/empty-card/start-staking-button"
                                size="large"
                            >
                                <Translation id="TR_STAKING_CARD_START_STAKING" />
                            </Button>
                        </Tooltip>
                    </Column>
                </Card>
            </Column>

            <ContextMessage context={Context.getLegal('gateway')} />
        </DashboardSection>
    );
};
