import { useEffect } from 'react';

import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Card, Column, Icon, Banner } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';

import { Translation } from 'src/components/suite/Translation';
import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import { useCardanoStaking, getReasonForDisabledAction } from 'src/hooks/wallet/useCardanoStaking';
import { CardanoActionPending } from './CardanoActionPending';
import { Account } from 'src/types/wallet';

import { DeviceButton } from './DeviceButton';
import {
    Title,
    Row,
    Column as CardanoColumn,
    Actions,
    Heading,
    Value,
    Text,
    Content,
    StyledH2,
} from './CardanoPrimitives';
import { spacings } from '@trezor/theme';

interface CardanoStakeProps {
    account: Account;
    deviceModel: DeviceModelInternal;
}

export const CardanoStake = ({ account, deviceModel }: CardanoStakeProps) => {
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

    useEffect(() => {
        calculateFeeAndDeposit('delegate');
    }, [calculateFeeAndDeposit]);

    const reasonMessageId = getReasonForDisabledAction(delegatingAvailable?.reason);
    const isStakingDisabled =
        account.availableBalance === '0' ||
        !delegatingAvailable.status ||
        !deviceAvailable.status ||
        !!pendingStakeTx;

    return (
        <Card>
            <Column gap={spacings.xs}>
                <StyledH2>
                    <Icon name="close" size={25} />
                    <Heading>
                        <Translation id="TR_STAKING_STAKE_TITLE" />
                    </Heading>
                </StyledH2>
                <Text>
                    <Translation id="TR_STAKING_STAKE_DESCRIPTION" values={{ br: <br /> }} />
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
                {delegatingAvailable.status && !pendingStakeTx ? (
                    // delegation is allowed
                    <>
                        <Row>
                            <CardanoColumn>
                                <Title>
                                    <Translation id="TR_STAKING_DEPOSIT" />
                                </Title>
                                <Value>
                                    {formatNetworkAmount(deposit || '0', account.symbol)}{' '}
                                    {account.symbol.toUpperCase()}
                                </Value>
                            </CardanoColumn>
                        </Row>
                        <Row>
                            <CardanoColumn>
                                <Title>
                                    <Translation id="TR_STAKING_FEE" />
                                </Title>
                                <Value>
                                    {formatNetworkAmount(fee || '0', account.symbol)}{' '}
                                    {account.symbol.toUpperCase()}
                                </Value>
                            </CardanoColumn>
                        </Row>
                    </>
                ) : (
                    // If building a transaction fails we don't have the information about used deposit and fee required
                    <>
                        {!delegatingAvailable.status &&
                            delegatingAvailable.reason === 'UTXO_BALANCE_INSUFFICIENT' && (
                                <Row>
                                    <CardanoColumn>
                                        <Banner variant="info">
                                            <div>
                                                <Translation id="TR_STAKING_NOT_ENOUGH_FUNDS" />
                                                <br />
                                                <Translation
                                                    id="TR_STAKING_DEPOSIT_FEE_DECRIPTION"
                                                    values={{ feeAmount: 2 }}
                                                />
                                            </div>
                                        </Banner>
                                    </CardanoColumn>
                                </Row>
                            )}
                        {pendingStakeTx && (
                            <Row>
                                <CardanoActionPending />
                            </Row>
                        )}
                    </>
                )}
                <Actions>
                    <DeviceButton
                        isDisabled={isStakingDisabled}
                        isLoading={loading}
                        onClick={delegate}
                        deviceModelInternal={deviceModel}
                        tooltipContent={
                            !reasonMessageId ||
                            (deviceAvailable.status && delegatingAvailable.status) ? undefined : (
                                <Translation id={reasonMessageId} />
                            )
                        }
                    >
                        <Translation id="TR_STAKING_DELEGATE" />
                    </DeviceButton>
                </Actions>
            </Column>
        </Card>
    );
};
