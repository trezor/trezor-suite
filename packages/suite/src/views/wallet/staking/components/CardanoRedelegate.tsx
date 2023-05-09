import React, { useEffect } from 'react';
import { Button, Icon, Tooltip, Card } from '@trezor/components';
import { getReasonForDisabledAction, useCardanoStaking } from '@wallet-hooks/useCardanoStaking';
import { Translation } from '@suite-components/Translation';
import { Actions, Title, Heading, Text } from './CardanoPrimitives';
import { DeviceModel } from '@trezor/device-utils';
import { useDeviceModel } from '@suite-hooks/useDeviceModel';

export const CardanoRedelegate = () => {
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
    const deviceModel = useDeviceModel() as DeviceModel.TT | DeviceModel.T2B1; // only TT and T2B1 have Capability_Cardano

    useEffect(() => {
        calculateFeeAndDeposit('delegate');
    }, [calculateFeeAndDeposit]);

    const actionButton = (
        <Button
            isLoading={loading}
            isDisabled={!delegatingAvailable.status || !deviceAvailable.status || !!pendingStakeTx}
            icon={`TREZOR_T${deviceModel}`}
            onClick={delegate}
        >
            <Translation id="TR_STAKING_REDELEGATE" />
        </Button>
    );

    const reasonMessageId = getReasonForDisabledAction(
        isFetchError ? 'POOL_ID_FETCH_FAIL' : delegatingAvailable?.reason,
    );
    const isRedelegatingDisabled =
        !delegatingAvailable.status || !deviceAvailable.status || !!pendingStakeTx;

    return (
        <Card>
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
                <DeviceButton
                    isLoading={loading}
                    isDisabled={isRedelegatingDisabled}
                    deviceModel={deviceModel}
                    onClick={delegate}
                    tooltipContent={
                        !reasonMessageId ||
                        (deviceAvailable.status &&
                            delegatingAvailable.status &&
                            !isFetchError) ? undefined : (
                            // eslint-disable-next-line react/jsx-indent
                            <Translation id={reasonMessageId} />
                        )
                    }
                >
                    <Translation id="TR_STAKING_REDELEGATE" />
                </DeviceButton>
            </Actions>
        </Card>
    );
};
