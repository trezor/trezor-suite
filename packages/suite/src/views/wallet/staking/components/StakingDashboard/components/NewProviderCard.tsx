import { Translation } from '@suite/intl';
import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectPoolStatsApyData } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { isCardanoStakedWithFiveBinaries } from '@suite-common/wallet-utils';
import { Button, Card, Column, H3, Icon, Paragraph, Row, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { openModal } from 'src/actions/suite/modalActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { formatApyValue } from 'src/views/wallet/staking/utils/formatStakeValues';

interface NewProviderCardProps {
    account: Account;
}

export const NewProviderCard = ({ account }: NewProviderCardProps) => {
    const dispatch = useDispatch();

    const { isStakingDisabled, stakingMessageContent } = useMessageSystemStaking(account?.symbol);

    const apy = useSelector(state => selectPoolStatsApyData(state, account));

    const isStakedWithFiveBinaries = isCardanoStakedWithFiveBinaries(account);

    const displaySymbol = account?.symbol ? getNetworkDisplaySymbol(account.symbol) : '';

    const openStakeInANutshellModal = () => {
        if (!isStakingDisabled) {
            dispatch(
                openModal({
                    type: 'earn-in-a-nutshell',
                    flow: EarnFlow.UpdateProvider,
                    provider: EarnProvider.Everstake,
                    account,
                    analyticsStep: 'staking-dashboard',
                }),
            );
        }
    };

    return (
        <Card paddingType="large">
            <Row alignItems="start" gap={spacings.xs}>
                <Icon name="warning" intent="warning" size={32} />

                <Column gap={spacings.xxxl}>
                    <Column gap={spacings.xs}>
                        <H3>
                            <Translation
                                id={
                                    isStakedWithFiveBinaries
                                        ? 'TR_STAKING_NEW_PROVIDER_OUTDATED_TITLE'
                                        : 'TR_STAKING_NEW_PROVIDER_TITLE'
                                }
                                values={{ apy: formatApyValue(apy) }}
                            />
                        </H3>
                        <Paragraph intent="neutral" priority="secondary" maxWidth={700}>
                            <Translation
                                id={
                                    isStakedWithFiveBinaries
                                        ? 'TR_STAKING_NEW_PROVIDER_OUTDATED_TEXT'
                                        : 'TR_STAKING_NEW_PROVIDER_TEXT'
                                }
                                values={{ apy: formatApyValue(apy), displaySymbol }}
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
                            <Translation id="TR_EARN_UPDATE_PROVIDER" />
                        </Button>
                    </Tooltip>
                </Column>
            </Row>
        </Card>
    );
};
