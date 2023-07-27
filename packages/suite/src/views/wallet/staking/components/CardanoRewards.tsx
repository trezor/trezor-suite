import React, { useEffect } from 'react';
import { Icon } from '@trezor/components';
import { getReasonForDisabledAction, useCardanoStaking } from 'src/hooks/wallet/useCardanoStaking';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Translation } from 'src/components/suite/Translation';
import { CardanoActionPending } from './CardanoActionPending';
import { Account } from 'src/types/wallet';
import {
    StyledH1,
    Actions,
    Heading,
    Row,
    Text,
    Value,
    Title,
    Content,
    Column,
    StyledCard,
} from './CardanoPrimitives';
import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import { DeviceButton } from 'src/components/suite';
import { DeviceModelInternal } from '@trezor/connect';
import { useDevice } from 'src/hooks/suite';

interface CardanoRewardsProps {
    account: Account;
}

export const CardanoRewards = ({ account }: CardanoRewardsProps) => {
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
    const { device } = useDevice();
    const deviceModelInternal = device?.features?.internal_model as
        | DeviceModelInternal.T2T1
        | DeviceModelInternal.T2B1; // only TT and T2B1 have Capability_Cardano

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
        <StyledCard>
            <StyledH1>
                <Icon icon="CHECK" size={25} />
                <Heading>
                    <Translation id="TR_STAKING_REWARDS_TITLE" />
                </Heading>
            </StyledH1>
            <Text>
                <Translation id="TR_STAKING_REWARDS_DESCRIPTION" />
            </Text>
            <Row>
                <Content>
                    <Column>
                        <Title>
                            <Translation id="TR_STAKING_STAKE_ADDRESS" />
                        </Title>
                        <HiddenPlaceholder>
                            <Value>{address}</Value>
                        </HiddenPlaceholder>
                    </Column>
                </Content>
            </Row>
            <Row>
                <Content>
                    <Column>
                        <Title>
                            <Translation id="TR_STAKING_REWARDS" />
                        </Title>
                        <HiddenPlaceholder>
                            <Value>
                                {formatNetworkAmount(rewards, account.symbol)}{' '}
                                {account.symbol.toUpperCase()}
                            </Value>
                        </HiddenPlaceholder>
                    </Column>
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
                    deviceModelInternal={deviceModelInternal}
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
        </StyledCard>
    );
};
