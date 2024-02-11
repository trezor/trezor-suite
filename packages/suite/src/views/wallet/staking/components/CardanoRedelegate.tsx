import { useEffect } from 'react';

import { Icon } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';

import { getReasonForDisabledAction, useCardanoStaking } from 'src/hooks/wallet/useCardanoStaking';
import { Translation } from 'src/components/suite/Translation';
import { Actions, Title, Heading, Text, StyledCard } from './CardanoPrimitives';
import { useDevice } from 'src/hooks/suite';

import { DeviceButton } from './DeviceButton';

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
    const { device } = useDevice();
    const deviceModelInternal = device?.features?.internal_model as
        | DeviceModelInternal.T2T1
        | DeviceModelInternal.T2B1; // only T2T1 and T2B1 have Capability_Cardano

    useEffect(() => {
        calculateFeeAndDeposit('delegate');
    }, [calculateFeeAndDeposit]);

    const reasonMessageId = getReasonForDisabledAction(
        isFetchError ? 'POOL_ID_FETCH_FAIL' : delegatingAvailable?.reason,
    );
    const isRedelegatingDisabled =
        !delegatingAvailable.status || !deviceAvailable.status || !!pendingStakeTx;

    return (
        <StyledCard>
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
                    deviceModelInternal={deviceModelInternal}
                    onClick={delegate}
                    tooltipContent={
                        !reasonMessageId ||
                        (deviceAvailable.status &&
                            delegatingAvailable.status &&
                            !isFetchError) ? undefined : (
                            <Translation id={reasonMessageId} />
                        )
                    }
                >
                    <Translation id="TR_STAKING_REDELEGATE" />
                </DeviceButton>
            </Actions>
        </StyledCard>
    );
};
