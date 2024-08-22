import { useEffect } from 'react';

import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Card, Column, Icon } from '@trezor/components';

import { getReasonForDisabledAction, useCardanoStaking } from 'src/hooks/wallet/useCardanoStaking';
import { Translation } from 'src/components/suite/Translation';
import { Account } from 'src/types/wallet';
import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';

import { DeviceButton } from './DeviceButton';
import {
    StyledH2,
    Actions,
    Heading,
    Row,
    Text,
    Value,
    Title,
    Content,
    Column as CardanoColumn,
} from './CardanoPrimitives';
import { CardanoActionPending } from './CardanoActionPending';
import { DeviceModelInternal } from '@trezor/connect';
import { spacings } from '@trezor/theme';

interface CardanoRewardsProps {
    account: Account;
    deviceModel: DeviceModelInternal;
}

export const CardanoRewards = ({ account, deviceModel }: CardanoRewardsProps) => {
    const {
        address,
        rewards,
        withdraw,
        calculateFeeAndDeposit,
        loading,
        withdrawingAvailable,
        deviceAvailable,
        pendingStakeTx,
    } = useCardanoStaking();

    useEffect(() => {
        calculateFeeAndDeposit('withdrawal');
    }, [calculateFeeAndDeposit]);

    const reasonMessageId = getReasonForDisabledAction(withdrawingAvailable?.reason);
    const isRewardsWithdrawDisabled =
        rewards === '0' ||
        !withdrawingAvailable.status ||
        !deviceAvailable.status ||
        !!pendingStakeTx;

    return (
        <Card>
            <Column gap={spacings.xs}>
                <StyledH2>
                    <Icon name="check" size={25} />
                    <Heading>
                        <Translation id="TR_STAKING_REWARDS_TITLE" />
                    </Heading>
                </StyledH2>
                <Text>
                    <Translation id="TR_STAKING_REWARDS_DESCRIPTION" />
                </Text>
                <Row>
                    <Content>
                        <CardanoColumn>
                            <Title>
                                <Translation id="TR_STAKING_STAKE_ADDRESS" />
                            </Title>
                            <HiddenPlaceholder>
                                <Value>{address}</Value>
                            </HiddenPlaceholder>
                        </CardanoColumn>
                    </Content>
                </Row>
                <Row>
                    <Content>
                        <CardanoColumn>
                            <Title>
                                <Translation id="TR_STAKING_REWARDS" />
                            </Title>
                            <HiddenPlaceholder>
                                <Value>
                                    {formatNetworkAmount(rewards, account.symbol)}{' '}
                                    {account.symbol.toUpperCase()}
                                </Value>
                            </HiddenPlaceholder>
                        </CardanoColumn>
                    </Content>
                </Row>
                {pendingStakeTx && (
                    <Row>
                        <CardanoActionPending />
                    </Row>
                )}

                <Actions>
                    <DeviceButton
                        isLoading={loading}
                        isDisabled={isRewardsWithdrawDisabled}
                        deviceModelInternal={deviceModel}
                        onClick={withdraw}
                        tooltipContent={
                            !reasonMessageId ||
                            (deviceAvailable.status && withdrawingAvailable.status) ? undefined : (
                                <Translation id={reasonMessageId} />
                            )
                        }
                    >
                        <Translation id="TR_STAKING_WITHDRAW" />
                    </DeviceButton>
                </Actions>
            </Column>
        </Card>
    );
};
