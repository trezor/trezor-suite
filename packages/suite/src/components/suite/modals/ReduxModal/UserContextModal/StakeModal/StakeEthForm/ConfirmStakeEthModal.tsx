import { useMemo, useState } from 'react';

import { type NetworkType, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';
import { selectValidatorsQueueData } from '@suite-common/wallet-core';
import { Banner, Card, Checkbox, Column, Modal } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_ETH_STAKING, HELP_CENTER_SOL_STAKING } from '@trezor/urls';

import { openModal } from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { getDaysToAddToPoolInitial } from 'src/utils/suite/ethereumStaking';

const getStakeEnteringMessage = (networkType?: NetworkType) => {
    if (networkType === 'ethereum') return 'TR_STAKE_ENTERING_POOL_MAY_TAKE';

    return 'TR_STAKE_ACTIVATION_COULD_TAKE';
};

interface ConfirmStakeEthModalProps {
    isLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmStakeEthModal = ({
    isLoading,
    onConfirm,
    onCancel,
}: ConfirmStakeEthModalProps) => {
    const dispatch = useDispatch();
    const [hasAgreed, setHasAgreed] = useState(false);
    const account = useSelector(selectSelectedAccount);
    const validatorsQueue = useSelector(state => selectValidatorsQueueData(state, account?.symbol));

    const daysToAddToPoolInitial = getDaysToAddToPoolInitial(validatorsQueue);
    const daysToAddToPool = daysToAddToPoolInitial === undefined ? 30 : daysToAddToPoolInitial;

    const isDisabled = !hasAgreed || isLoading;

    const handleOnCancel = () => {
        onCancel();
        dispatch(openModal({ type: 'stake' }));

        analytics.report({
            type: EventType.StakingStake,
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
            type: EventType.StakingStake,
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
            default:
                return undefined;
        }
    }, [account]);

    if (!account) return null;

    return (
        <Modal
            heading={<Translation id="TR_STAKE_CONFIRM_ENTRY_PERIOD" />}
            onCancel={handleOnCancel}
            size="small"
            variant="warning"
            bottomContent={
                <>
                    <Modal.Button isDisabled={isDisabled} onClick={onClick}>
                        <Translation id="TR_STAKE_CONFIRM_AND_STAKE" />
                    </Modal.Button>
                    <Modal.Button variant="tertiary" onClick={handleOnCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={spacings.sm} margin={{ top: spacings.xxs, bottom: spacings.lg }}>
                <Banner icon="clock">
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
                </Banner>
                <Banner
                    icon="hand"
                    rightContent={
                        <Banner.Button href={learnMoreLink}>
                            <Translation id="TR_LEARN_MORE" />
                        </Banner.Button>
                    }
                >
                    <Translation
                        id="TR_STAKE_ETH_WILL_BE_BLOCKED"
                        values={{
                            networkDisplaySymbol: getNetworkDisplaySymbol(account.symbol),
                        }}
                    />
                </Banner>
            </Column>

            <Card>
                <Checkbox onClick={() => setHasAgreed(!hasAgreed)} isChecked={hasAgreed}>
                    <Translation id="TR_STAKE_ACKNOWLEDGE_ENTRY_PERIOD" />
                </Checkbox>
            </Card>
        </Modal>
    );
};
