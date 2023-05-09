import React, { useEffect } from 'react';
import { Button, Icon, Tooltip, Card } from '@trezor/components';
import { getReasonForDisabledAction, useCardanoStaking } from '@wallet-hooks/useCardanoStaking';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Translation } from '@suite-components/Translation';
import { CardanoActionPending } from './CardanoActionPending';
import { Account } from '@suite/types/wallet';
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
} from './CardanoPrimitives';
import { HiddenPlaceholder } from '@suite-components/HiddenPlaceholder';
import { DeviceModel } from '@trezor/device-utils';
import { useDeviceModel } from '@suite-hooks/useDeviceModel';

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
    const deviceModel = useDeviceModel() as DeviceModel.TT | DeviceModel.T2B1; // only T and T2B1 have Capability_Cardano

    useEffect(() => {
        calculateFeeAndDeposit('withdrawal');
    }, [calculateFeeAndDeposit]);

    const actionButton = (
        <Button
            isLoading={loading}
            isDisabled={
                rewards === '0' ||
                !withdrawingAvailable.status ||
                !deviceAvailable.status ||
                !!pendingStakeTx
            }
            icon={`TREZOR_T${deviceModel}`}
            onClick={withdraw}
        >
            <Translation id="TR_STAKING_WITHDRAW" />
        </Button>
    );

    const reasonMessageId = getReasonForDisabledAction(withdrawingAvailable?.reason);
    const isRewardsWithdrawDisabled =
        rewards === '0' ||
        !withdrawingAvailable.status ||
        !deviceAvailable.status ||
        !!pendingStakeTx;

    return (
        <Card>
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
                    deviceModel={deviceModel}
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
        </Card>
    );
};
