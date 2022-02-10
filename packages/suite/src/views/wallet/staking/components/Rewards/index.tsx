import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Button, variables, Icon, Tooltip } from '@trezor/components';
import { getReasonForDisabledAction, useCardanoStaking } from '@wallet-hooks/useCardanoStaking';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { Translation } from '@suite-components/Translation';
import ActionInProgress from '../ActionInProgress';
import { Account } from '@suite/types/wallet';
import {
    StyledH1,
    Actions,
    Heading,
    StyledCard,
    Row,
    ValueSmall,
    Text,
    Value,
    Title,
    Content,
    Column,
} from '../primitives';
import { HiddenPlaceholder } from '@suite-components/HiddenPlaceholder';

const TitleSecond = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    margin-top: 30px;
`;

const Rewards = (props: { account: Account }) => {
    const {
        address,
        rewards,
        withdraw,
        calculateFeeAndDeposit,
        loading,
        actionAvailable,
        deviceAvailable,
        pendingStakeTx,
    } = useCardanoStaking();
    const { account } = props;

    useEffect(() => {
        calculateFeeAndDeposit('withdrawal');
    }, [calculateFeeAndDeposit]);

    const actionButton = (
        <Button
            isLoading={loading}
            isDisabled={
                rewards === '0' ||
                !actionAvailable.status ||
                !deviceAvailable.status ||
                !!pendingStakeTx
            }
            icon="T2"
            onClick={() => withdraw()}
        >
            <Translation id="TR_STAKING_WITHDRAW" />
        </Button>
    );

    const reasonMessageId = getReasonForDisabledAction(actionAvailable?.reason);

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
                            <ValueSmall>{address}</ValueSmall>
                        </HiddenPlaceholder>
                        <TitleSecond>
                            <Translation id="TR_STAKING_REWARDS" />
                        </TitleSecond>
                        <Value>
                            <HiddenPlaceholder>
                                {formatNetworkAmount(rewards, account.symbol)}{' '}
                                {account.symbol.toUpperCase()}
                            </HiddenPlaceholder>
                        </Value>
                    </Column>
                </Content>
            </Row>
            {pendingStakeTx && (
                <Row>
                    <ActionInProgress />
                </Row>
            )}

            <Actions>
                {deviceAvailable.status && actionAvailable.status ? (
                    actionButton
                ) : (
                    <Tooltip
                        maxWidth={285}
                        content={reasonMessageId ? <Translation id={reasonMessageId} /> : undefined}
                    >
                        {actionButton}
                    </Tooltip>
                )}
            </Actions>
        </StyledCard>
    );
};

export default Rewards;
