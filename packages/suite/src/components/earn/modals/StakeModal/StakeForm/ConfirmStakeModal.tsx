import { useMemo, useState } from 'react';

import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { getDaysToAddToPoolInitial } from '@suite-common/staking';
import { EarnFlow, type StakeModalFlow } from '@suite-common/suite-types/src/staking';
import { type NetworkType, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';
import { selectValidatorsQueueData } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { Banner, Card, Checkbox, Column, Modal } from '@trezor/components';

import { earnFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

import { getStakingHelpCenterLink } from '../../../utils/getStakingHelpCenterLink';

const getStakeEnteringMessage = (networkType?: NetworkType) => {
    if (networkType === 'ethereum') return 'TR_STAKE_ENTERING_POOL_MAY_TAKE';

    return 'TR_STAKE_ACTIVATION_COULD_TAKE';
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
    const analytics = useAnalytics();
    const dispatch = useDispatch();
    const [hasAgreed, setHasAgreed] = useState(false);
    const validatorsQueue = useSelector(state => selectValidatorsQueueData(state, account.symbol));

    const daysToAddToPool = getDaysToAddToPoolInitial(validatorsQueue);

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
                    icon="clock"
                    description={
                        <Translation
                            id={getStakeEnteringMessage(account.networkType)}
                            values={{
                                networkDisplaySymbol: getNetworkDisplaySymbol(account.symbol),
                                count:
                                    account.networkType === 'ethereum'
                                        ? daysToAddToPool
                                        : SOLANA_EPOCH_DAYS,
                            }}
                        />
                    }
                />
                <Banner
                    icon="hand"
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
                    onClick={() => setHasAgreed(!hasAgreed)}
                    isChecked={hasAgreed}
                >
                    <Translation id="TR_STAKE_ACKNOWLEDGE_ENTRY_PERIOD" />
                </Checkbox>
            </Card>
        </Modal>
    );
};
