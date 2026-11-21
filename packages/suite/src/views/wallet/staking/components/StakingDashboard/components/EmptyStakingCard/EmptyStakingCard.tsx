import { Translation } from '@suite/intl';
import { ContextMessage } from '@suite/message-system';
import { Context } from '@suite-common/message-system';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Button, Card, Column, Grid, H3, Paragraph, Tooltip } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

import { DashboardSection } from '#src/components/dashboard/DashboardSection';
import { useTronFirmwareUpgradeModal } from '#src/hooks/earn/useTronFirmwareUpgradeModal';
import { useLayoutSize } from '#src/hooks/suite/useLayoutSize';
import { useSelector } from '#src/hooks/suite/useSelector';

import { DiscoveryWarning } from '../DiscoveryWarning';
import { EmptyStakingCardFeature } from './EmptyStakingCardFeature';
import { getNetworkVariant, useStakingCardContent } from './useEmptyStakingCardContent';
import { useEmptyStakingCardData } from './useEmptyStakingCardData';

type EmptyStakingCardProps = {
    account: Account;
};

export const EmptyStakingCard = ({ account }: EmptyStakingCardProps) => {
    const { isBelowLaptop } = useLayoutSize();

    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const variant = getNetworkVariant(account);
    const data = useEmptyStakingCardData({ account });
    const content = useStakingCardContent({ variant, data });

    const { openFirmwareModal, firmwareModal } = useTronFirmwareUpgradeModal();

    // A first stake that firmware withholds asks for the update instead of opening the flow.
    const onStartStakingClick = () => {
        if (data.isStartStakingFirmwareOutdated) {
            openFirmwareModal('TR_EARN_TRON_STAKE_TITLE');

            return;
        }

        content.onStartStakingClick();
    };

    return (
        <DashboardSection data-testid="@wallet/staking/empty-card">
            {firmwareModal}

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

                        <Tooltip content={data.stakingMessageContent}>
                            <Button
                                onClick={onStartStakingClick}
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
