import { useMemo, useState } from 'react';

import { injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { useNetworkStakingPeriods } from '@suite-common/earn-staking';
import { EarnFlow, type StakeModalFlow } from '@suite-common/suite-types/src/staking';
import { type NetworkType, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { getStakingHelpCenterLink } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Banner, Card, Checkbox, Column, Modal } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { ClockIcon, HandIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { earnFlowToEventTypeMap } from '#src/constants/suite/staking';

const getStakeEnteringMessageId = (networkType: NetworkType, entryPeriodDays: number | null) => {
    if (networkType === 'ethereum') {
        return entryPeriodDays === null
            ? 'TR_STAKE_ENTERING_POOL_MAY_TAKE_WITHOUT_DAYS'
            : 'TR_STAKE_ENTERING_POOL_MAY_TAKE';
    }

    return entryPeriodDays === null
        ? 'TR_STAKE_ACTIVATION_COULD_TAKE_WITHOUT_DAYS'
        : 'TR_STAKE_ACTIVATION_COULD_TAKE';
};

type ConfirmStakeModalProps = {
    account: Account;
    isLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    flow: StakeModalFlow;
};

export const ConfirmStakeModal = ({
    account,
    isLoading,
    onConfirm,
    onCancel,
    flow,
}: ConfirmStakeModalProps) => {
    const [hasAgreed, setHasAgreed] = useState(false);

    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const { entryPeriodDays } = useNetworkStakingPeriods(account.symbol);

    const isDisabled = !hasAgreed || isLoading;

    const handleOnCancel = () => {
        onCancel();
        dispatch(
            openModal({
                type: 'stake',
                flow,
                account,
            }),
        );

        analytics.report({
            type: earnFlowToEventTypeMap[EarnFlow.Stake],
            payload: {
                action: 'cancel',
                step: 'entry-period-stake-modal',
                networkSymbol: account.symbol,
            },
        });
    };

    const onClick = () => {
        onConfirm();

        analytics.report({
            type: earnFlowToEventTypeMap[EarnFlow.Stake],
            payload: {
                action: 'continue',
                step: 'entry-period-stake-modal',
                networkSymbol: account.symbol,
            },
        });
    };

    const learnMoreLink = useMemo(
        () => getStakingHelpCenterLink(account.networkType),
        [account.networkType],
    );

    return (
        <Modal
            heading={<Translation id="TR_STAKE_CONFIRM_ENTRY_PERIOD" />}
            onCancel={handleOnCancel}
            width={600}
            intent="warning"
            bottomContent={
                <>
                    <Modal.Button
                        isDisabled={isDisabled}
                        onClick={onClick}
                        data-testid="@modal/staking/confirm-and-stake-button"
                    >
                        <Translation id="TR_STAKE_CONFIRM_AND_STAKE" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={handleOnCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={12} margin={{ top: 4, bottom: 20 }}>
                <Banner
                    icon={ClockIcon}
                    description={
                        <Translation
                            id={getStakeEnteringMessageId(account.networkType, entryPeriodDays)}
                            values={{
                                networkDisplaySymbol: getNetworkDisplaySymbol(account.symbol),
                                count: entryPeriodDays ?? undefined,
                            }}
                        />
                    }
                />
                <Banner
                    icon={HandIcon}
                    rightContent={
                        <Banner.Button href={learnMoreLink}>
                            <Translation id="TR_LEARN_MORE" />
                        </Banner.Button>
                    }
                    description={
                        <Translation
                            id="TR_STAKE_ETH_WILL_BE_BLOCKED"
                            values={{
                                networkDisplaySymbol: getNetworkDisplaySymbol(account.symbol),
                            }}
                        />
                    }
                />
            </Column>

            <Card>
                <Checkbox
                    data-testid="@staking/acknowledge-checkbox"
                    onChange={() => setHasAgreed(!hasAgreed)}
                    isChecked={hasAgreed}
                >
                    <Translation id="TR_STAKE_ACKNOWLEDGE_ENTRY_PERIOD" />
                </Checkbox>
            </Card>
        </Modal>
    );
};
