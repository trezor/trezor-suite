import React, { useEffect } from 'react';
import styled from 'styled-components';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Button, Icon, Tooltip } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { HiddenPlaceholder } from '@suite-components/HiddenPlaceholder';
import { useCardanoStaking, getReasonForDisabledAction } from '@wallet-hooks/useCardanoStaking';
import ActionInProgress from '../ActionInProgress';
import { Account } from '@wallet-types';
import {
    Title,
    Row,
    Column,
    InfoBox,
    Actions,
    Heading,
    ValueSmall,
    Text,
    StyledCard,
    Content,
    StyledH1,
} from '../primitives';
import { DeviceModel } from '@trezor/device-utils';
import { useDeviceModel } from '@suite-hooks/useDeviceModel';

const ColumnDeposit = styled(Column)`
    margin-left: 30px;
`;

const Delegate = (props: { account: Account }) => {
    const {
        address,
        delegate,
        deposit,
        calculateFeeAndDeposit,
        fee,
        loading,
        delegatingAvailable,
        deviceAvailable,
        pendingStakeTx,
    } = useCardanoStaking();
    const deviceModel = useDeviceModel() as DeviceModel.TT | DeviceModel.TR; // only T and R have Capability_Cardano

    const { account } = props;

    useEffect(() => {
        calculateFeeAndDeposit('delegate');
    }, [calculateFeeAndDeposit]);

    const actionButton = (
        <Button
            isDisabled={
                account.availableBalance === '0' ||
                !delegatingAvailable.status ||
                !deviceAvailable.status ||
                !!pendingStakeTx
            }
            isLoading={loading}
            onClick={() => delegate()}
            icon={`TREZOR_T${deviceModel}`}
        >
            <Translation id="TR_STAKING_DELEGATE" />
        </Button>
    );

    const reasonMessageId = getReasonForDisabledAction(delegatingAvailable?.reason);

    return (
        <StyledCard>
            <StyledH1>
                <Icon icon="CROSS" size={25} />
                <Heading>
                    <Translation id="TR_STAKING_STAKE_TITLE" />
                </Heading>
            </StyledH1>
            <Text>
                <Translation id="TR_STAKING_STAKE_DESCRIPTION" values={{ br: <br /> }} />
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
                    </Column>
                </Content>
            </Row>
            <Row>
                {delegatingAvailable.status && !pendingStakeTx ? (
                    // delegation is allowed
                    <>
                        <Column>
                            <Title>
                                <Translation id="TR_STAKING_DEPOSIT" />
                            </Title>
                            <ValueSmall>
                                {formatNetworkAmount(deposit || '0', account.symbol)}{' '}
                                {account.symbol.toUpperCase()}
                            </ValueSmall>
                        </Column>
                        <ColumnDeposit>
                            <Title>
                                <Translation id="TR_STAKING_FEE" />
                            </Title>
                            <ValueSmall>
                                {formatNetworkAmount(fee || '0', account.symbol)}{' '}
                                {account.symbol.toUpperCase()}
                            </ValueSmall>
                        </ColumnDeposit>
                    </>
                ) : (
                    // If building a transaction fails we don't have the information about used deposit and fee required
                    <>
                        {!delegatingAvailable.status &&
                            delegatingAvailable.reason === 'UTXO_BALANCE_INSUFFICIENT' && (
                                <Column>
                                    <InfoBox>
                                        <Translation id="TR_STAKING_NOT_ENOUGH_FUNDS" />
                                        <Translation
                                            id="TR_STAKING_DEPOSIT_FEE_DECRIPTION"
                                            values={{ feeAmount: 2 }}
                                        />
                                    </InfoBox>
                                </Column>
                            )}
                        {pendingStakeTx && <ActionInProgress />}
                    </>
                )}
            </Row>
            <Actions>
                {deviceAvailable.status && delegatingAvailable.status ? (
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

export default Delegate;
