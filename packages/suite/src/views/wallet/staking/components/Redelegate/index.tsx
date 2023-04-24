import React, { useEffect } from 'react';
import { Button, Icon, Tooltip } from '@trezor/components';
import { getReasonForDisabledAction, useCardanoStaking } from '@wallet-hooks/useCardanoStaking';
import { Translation } from '@suite-components/Translation';
import { Actions, StyledCard, Title, Heading, TransparentBox, Text } from '../primitives';
import { DeviceModel } from '@trezor/device-utils';
import { useDeviceModel } from '@suite-hooks/useDeviceModel';

const Redelegate = () => {
    const {
        delegate,
        calculateFeeAndDeposit,
        loading,
        delegatingAvailable,
        deviceAvailable,
        pendingStakeTx,
        isCurrentPoolOversaturated,
        isFetchError,
    } = useCardanoStaking();
    const deviceModel = useDeviceModel() as DeviceModel.TT | DeviceModel.T2B1; // only T and T2B1 have Capability_Cardano

    useEffect(() => {
        calculateFeeAndDeposit('delegate');
    }, [calculateFeeAndDeposit]);

    const actionButton = (
        <Button
            isLoading={loading}
            isDisabled={!delegatingAvailable.status || !deviceAvailable.status || !!pendingStakeTx}
            icon={`TREZOR_T${deviceModel}`}
            onClick={() => delegate()}
        >
            <Translation id="TR_STAKING_REDELEGATE" />
        </Button>
    );

    const reasonMessageId = getReasonForDisabledAction(
        isFetchError ? 'POOL_ID_FETCH_FAIL' : delegatingAvailable?.reason,
    );

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
                    {deviceAvailable.status && delegatingAvailable.status && !isFetchError ? (
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
