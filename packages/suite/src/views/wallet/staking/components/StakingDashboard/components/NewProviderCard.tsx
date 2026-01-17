import { EventType } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { StakingFlow } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectPoolStatsApyData } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { isCardanoStakedWithFiveBinaries } from '@suite-common/wallet-utils';
import { Button, Card, Column, H3, Icon, Paragraph, Row, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { openModal } from 'src/actions/suite/modalActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { useAnalytics } from 'src/support/useAnalytics';

interface NewProviderCardProps {
    account: Account;
}

export const NewProviderCard = ({ account }: NewProviderCardProps) => {
    const analytics = useAnalytics();
    const dispatch = useDispatch();

    const { isStakingDisabled, stakingMessageContent } = useMessageSystemStaking(account?.symbol);

    const apy = useSelector(state => selectPoolStatsApyData(state, account));

    const isStakedWithFiveBinaries = isCardanoStakedWithFiveBinaries(account);

    const displaySymbol = account?.symbol ? getNetworkDisplaySymbol(account.symbol) : '';

    const openStakeInANutshellModal = () => {
        if (!isStakingDisabled) {
            dispatch(
                openModal({
                    type: 'stake-in-a-nutshell',
                    flow: StakingFlow.UpdateProvider,
                }),
            );

            analytics.report({
                type: EventType.StakingUpdateProvider,
                payload: {
                    action: 'continue',
                    step: 'staking-dashboard',
                    networkSymbol: account?.symbol,
                },
            });
        }
    };

    return (
        <Card paddingType="large">
            <Row alignItems="start" gap={spacings.xs}>
                <Icon name="warning" variant="warning" size="extraLarge" />

                <Column gap={spacings.xxxl}>
                    <Column gap={spacings.xs}>
                        <H3>
                            <Translation
                                id={
                                    isStakedWithFiveBinaries
                                        ? 'TR_STAKING_NEW_PROVIDER_OUTDATED_TITLE'
                                        : 'TR_STAKING_NEW_PROVIDER_TITLE'
                                }
                                values={{ apy }}
                            />
                        </H3>
                        <Paragraph variant="tertiary" maxWidth={700}>
                            <Translation
                                id={
                                    isStakedWithFiveBinaries
                                        ? 'TR_STAKING_NEW_PROVIDER_OUTDATED_TEXT'
                                        : 'TR_STAKING_NEW_PROVIDER_TEXT'
                                }
                                values={{ apy, displaySymbol }}
                            />
                        </Paragraph>
                    </Column>

                    <Tooltip content={stakingMessageContent}>
                        <Button
                            onClick={openStakeInANutshellModal}
                            isDisabled={isStakingDisabled}
                            iconLeft={isStakingDisabled ? 'info' : undefined}
                            data-testid="@wallet/staking/empty-card/start-staking-button"
                        >
                            <Translation id="TR_STAKING_UPDATE_PROVIDER" />
                        </Button>
                    </Tooltip>
                </Column>
            </Row>
        </Card>
    );
};
