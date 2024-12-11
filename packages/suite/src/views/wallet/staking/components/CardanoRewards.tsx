import { useEffect } from 'react';

import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Card, Column, Icon } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';
import { spacings } from '@trezor/theme';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';

import { useDispatch } from 'src/hooks/suite';
import { getReasonForDisabledAction, useCardanoStaking } from 'src/hooks/wallet/useCardanoStaking';
import { Translation } from 'src/components/suite/Translation';
import { Account } from 'src/types/wallet';
import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import { openModal } from 'src/actions/suite/modalActions';

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

interface CardanoRewardsProps {
    account: Account;
    deviceModel: DeviceModelInternal;
}

export const CardanoRewards = ({ account, deviceModel }: CardanoRewardsProps) => {
    const {
        address,
        rewards,
        calculateFeeAndDeposit,
        loading,
        withdrawal,
        withdrawingAvailable,
        deviceAvailable,
        alreadyVoted,
        pendingStakeTx,
    } = useCardanoStaking();

    const dispatch = useDispatch();

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
            <Column gap={spacings.xs} alignItems="center">
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
                                    {getNetworkDisplaySymbol(account.symbol)}
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
                        onClick={() => {
                            if (alreadyVoted) {
                                withdrawal();
                            } else {
                                dispatch(openModal({ type: 'cardano-withdraw-modal' }));
                            }
                        }}
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
