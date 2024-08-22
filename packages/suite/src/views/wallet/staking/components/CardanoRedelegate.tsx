import { useEffect } from 'react';

import { IconLegacy } from '@trezor/components';

import { getReasonForDisabledAction, useCardanoStaking } from 'src/hooks/wallet/useCardanoStaking';
import { Translation } from 'src/components/suite/Translation';
import { Actions, Title, Heading, Text, StyledCard } from './CardanoPrimitives';

import { DeviceButton } from './DeviceButton';
import { DeviceModelInternal } from '@trezor/connect';

interface CardanoRedelegateProps {
    deviceModel: DeviceModelInternal;
}

export const CardanoRedelegate = ({ deviceModel }: CardanoRedelegateProps) => {
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
                <IconLegacy icon="INFO" size={18} />
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
                    deviceModelInternal={deviceModel}
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
