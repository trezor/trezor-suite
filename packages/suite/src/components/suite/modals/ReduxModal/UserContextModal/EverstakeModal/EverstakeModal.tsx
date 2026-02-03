import { JSX, useMemo, useState } from 'react';

import { Translation } from '@suite/intl';
import { StakingFlow } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    DEFAULT_VOTING_OPTION,
    selectAccountIsStakingActive,
    selectVotingDelegationOption,
    stakeActions,
} from '@suite-common/wallet-core';
import { validateCardanoDrep } from '@suite-common/wallet-utils';
import { Banner, Card, Checkbox, Column, IconName, Modal } from '@trezor/components';

import { openModal } from 'src/actions/suite/modalActions';
import { stakingFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useAnalytics } from 'src/support/useAnalytics';

import { VotingDelegation } from './VotingDelegation';

interface EverstakeModalProps {
    onCancel: () => void;
    flow: StakingFlow;
}

export const EverstakeModal = ({ onCancel, flow }: EverstakeModalProps) => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const [hasAgreed, setHasAgreed] = useState(false);
    const account = useSelector(selectSelectedAccount);
    const isStakingActive = useSelector(state =>
        selectAccountIsStakingActive(state, account?.key ?? ''),
    );
    const selectedVotingDelegation = useSelector(selectVotingDelegationOption);
    const isCardanoNetworkType = account?.networkType === 'cardano';
    const isUpdateProviderFlow = isStakingActive && isCardanoNetworkType;

    const isDrepValid = useMemo(() => {
        if (!isCardanoNetworkType || selectedVotingDelegation.type !== 'another_drep') {
            return true;
        }

        return validateCardanoDrep(selectedVotingDelegation.drepId);
    }, [selectedVotingDelegation, isCardanoNetworkType]);

    const proceedToStaking = () => {
        onCancel();
        dispatch(openModal({ type: 'stake', flow }));

        analytics.report({
            type: stakingFlowToEventTypeMap[flow],
            payload: {
                action: 'continue',
                step: 'funds-maintained-modal',
                networkSymbol: account?.symbol,
                ...(flow === StakingFlow.UpdateProvider
                    ? { votingDelegation: selectedVotingDelegation.type }
                    : {}),
            },
        });
    };

    const onCancelClick = () => {
        dispatch(stakeActions.setVotingDelegationOption(DEFAULT_VOTING_OPTION));

        onCancel();

        analytics.report({
            type: stakingFlowToEventTypeMap[flow],
            payload: {
                action: 'cancel',
                step: 'funds-maintained-modal',
                networkSymbol: account?.symbol,
                ...(flow === StakingFlow.UpdateProvider
                    ? { votingDelegation: selectedVotingDelegation.type }
                    : {}),
            },
        });
    };

    if (!account) return null;

    const displaySymbol = getNetworkDisplaySymbol(account.symbol);

    const banners: {
        icon: IconName;
        message: JSX.Element;
    }[] = [
        {
            icon: 'fileFilled',
            message: (
                <Translation
                    id={
                        account?.networkType === 'ethereum'
                            ? 'TR_STAKE_EVERSTAKE_MANAGES'
                            : 'TR_STAKE_BY_STAKING_YOU_CAN_EARN_REWARDS'
                    }
                    values={{
                        networkDisplaySymbol: displaySymbol,
                        t: text => <strong>{text}</strong>,
                    }}
                />
            ),
        },
        {
            icon: 'shieldWarningFilled',
            message: (
                <Translation
                    id={
                        account?.networkType === 'ethereum'
                            ? 'TR_STAKE_TREZOR_NO_LIABILITY'
                            : 'TR_STAKE_SECURELY_DELEGATE_TO_EVERSTAKE'
                    }
                    values={{
                        symbol: displaySymbol,
                    }}
                />
            ),
        },
    ];

    return (
        <Modal
            heading={
                <Translation
                    id={
                        isUpdateProviderFlow ? 'TR_STAKING_UPDATE_PROVIDER' : 'TR_STAKE_STAKE_TOKEN'
                    }
                    values={{ symbol: displaySymbol }}
                />
            }
            description={
                <Translation
                    id="TR_STAKE_YOUR_FUNDS_MAINTAINED"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            }
            onCancel={onCancelClick}
            width={600}
            bottomContent={
                <>
                    <Modal.Button
                        isDisabled={!hasAgreed || !isDrepValid}
                        onClick={proceedToStaking}
                        data-testid="@modal/staking/confirm-button"
                    >
                        <Translation id="TR_CONFIRM" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onCancelClick}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={12} margin={{ top: 8, bottom: 20 }}>
                {banners.map(({ icon, message }, index) => (
                    <Banner icon={icon} intent="info" key={index} description={message} />
                ))}
            </Column>
            <Column gap={12}>
                <VotingDelegation />
                <Card>
                    <Checkbox
                        data-testid="@staking/everstake-acknowledge-checkbox"
                        verticalAlignment="center"
                        onClick={() => setHasAgreed(!hasAgreed)}
                        isChecked={hasAgreed}
                    >
                        <Translation id="TR_STAKE_CONSENT_TO_STAKING_WITH_EVERSTAKE" />
                    </Checkbox>
                </Card>
            </Column>
        </Modal>
    );
};
