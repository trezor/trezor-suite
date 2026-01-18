import { useMemo, useState } from 'react';

import { Translation } from '@suite/intl';
import { getDaysToAddToPoolInitial } from '@suite-common/staking';
import { StakingFlow } from '@suite-common/suite-types/src/staking';
import { type NetworkType, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';
import { selectValidatorsQueueData } from '@suite-common/wallet-core';
import { Banner, Card, Checkbox, Column, Modal } from '@trezor/components';
import { spacings } from '@trezor/theme';
import {
    HELP_CENTER_ADA_STAKING,
    HELP_CENTER_ETH_STAKING,
    HELP_CENTER_SOL_STAKING,
} from '@trezor/urls';

import { openModal } from 'src/actions/suite/modalActions';
import { stakingFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useAnalytics } from 'src/support/useAnalytics';

const getStakeEnteringMessage = (networkType?: NetworkType) => {
    if (networkType === 'ethereum') return 'TR_STAKE_ENTERING_POOL_MAY_TAKE';

    return 'TR_STAKE_ACTIVATION_COULD_TAKE';
};

interface ConfirmStakeModalProps {
    isLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    flow: StakingFlow;
}

export const ConfirmStakeModal = ({
    isLoading,
    onConfirm,
    onCancel,
    flow,
}: ConfirmStakeModalProps) => {
    const analytics = useAnalytics();
    const dispatch = useDispatch();
    const [hasAgreed, setHasAgreed] = useState(false);
    const account = useSelector(selectSelectedAccount);
    const validatorsQueue = useSelector(state => selectValidatorsQueueData(state, account?.symbol));

    const daysToAddToPool = getDaysToAddToPoolInitial(validatorsQueue);

    const isDisabled = !hasAgreed || isLoading;

    const handleOnCancel = () => {
        onCancel();
        dispatch(openModal({ type: 'stake', flow }));

        analytics.report({
            type: stakingFlowToEventTypeMap[flow],
            payload: {
                action: 'cancel',
                step: 'entry-period-stake-modal',
                networkSymbol: account?.symbol,
            },
        });
    };

    const onClick = () => {
        onConfirm();

        analytics.report({
            type: stakingFlowToEventTypeMap[flow],
            payload: {
                action: 'continue',
                step: 'entry-period-stake-modal',
                networkSymbol: account?.symbol,
            },
        });
    };

    const learnMoreLink = useMemo(() => {
        switch (account?.networkType) {
            case 'ethereum':
                return HELP_CENTER_ETH_STAKING;
            case 'solana':
                return HELP_CENTER_SOL_STAKING;
            case 'cardano':
                return HELP_CENTER_ADA_STAKING;
            default:
                return undefined;
        }
    }, [account]);

    if (!account) return null;

    return (
        <Modal
            heading={<Translation id="TR_STAKE_CONFIRM_ENTRY_PERIOD" />}
            onCancel={handleOnCancel}
            width={600}
            variant="warning"
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
            <Column gap={spacings.sm} margin={{ top: spacings.xxs, bottom: spacings.lg }}>
                <Banner
                    icon="clock"
                    description={
                        <Translation
                            id={getStakeEnteringMessage(account?.networkType)}
                            values={{
                                networkDisplaySymbol: getNetworkDisplaySymbol(account.symbol),
                                count:
                                    account?.networkType === 'ethereum'
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
