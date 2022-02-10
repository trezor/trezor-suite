import React, { useEffect } from 'react';
import { Button, Icon, Tooltip } from '@trezor/components';
import { getReasonForDisabledAction, useCardanoStaking } from '@wallet-hooks/useCardanoStaking';
import { Translation } from '@suite-components/Translation';
import { Actions, StyledCard, Title, Heading, TransparentBox, Text } from '../primitives';

const Redelegate = () => {
    const {
        delegate,
        calculateFeeAndDeposit,
        loading,
        actionAvailable,
        deviceAvailable,
        pendingStakeTx,
        isCurrentPoolOversaturated,
    } = useCardanoStaking();

    useEffect(() => {
        calculateFeeAndDeposit('delegate');
    }, [calculateFeeAndDeposit]);

    const actionButton = (
        <Button
            isLoading={loading}
            isDisabled={!actionAvailable.status || !deviceAvailable.status || !!pendingStakeTx}
            icon="T2"
            onClick={() => delegate()}
        >
            <Translation id="TR_STAKING_REDELEGATE" />
        </Button>
    );

    const reasonMessageId = getReasonForDisabledAction(actionAvailable?.reason);

    return (
        <StyledCard>
            <TransparentBox>
                <Title>
                    <Icon icon="INFO" size={18} />
                    <Heading>
                        <Translation
                            id={
                                isCurrentPoolOversaturated
                                    ? 'TR_STAKING_POOL_OVERSATURATED_TITLE'
                                    : 'TR_STAKING_ON_3RD_PARTY_TITLE'
                            }
                        />
                    </Heading>
                </Title>
                <Text>
                    <Translation
                        id={
                            isCurrentPoolOversaturated
                                ? 'TR_STAKING_POOL_OVERSATURATED_DESCRIPTION'
                                : 'TR_STAKING_ON_3RD_PARTY_DESCRIPTION'
                        }
                    />
                </Text>

                <Actions>
                    {deviceAvailable.status && actionAvailable.status ? (
                        actionButton
                    ) : (
                        <Tooltip
                            maxWidth={285}
                            content={
                                reasonMessageId ? <Translation id={reasonMessageId} /> : undefined
                            }
                        >
                            {actionButton}
                        </Tooltip>
                    )}
                </Actions>
            </TransparentBox>
        </StyledCard>
    );
};

export default Redelegate;
