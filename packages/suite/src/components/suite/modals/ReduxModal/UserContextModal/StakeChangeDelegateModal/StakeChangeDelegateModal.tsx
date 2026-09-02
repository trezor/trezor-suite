import { useEffect, useMemo } from 'react';
import { FormProvider } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import { selectFullSelectedAccount } from '@suite/account';
import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { CARDANO_EVERSTAKE_DREP } from '@suite-common/wallet-constants';
import {
    DEFAULT_VOTING_OPTION,
    selectVotingDelegationOption,
    stakeActions,
} from '@suite-common/wallet-core';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { getCardanoAccountDrepId, validateCardanoDrep } from '@suite-common/wallet-utils';
import { Card, Column, Modal, Tooltip } from '@trezor/components';

import { VotingDelegationsOptions } from 'src/components/earn';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import {
    ChangeDelegateFormContext,
    useChangeDelegateForm,
} from 'src/hooks/wallet/useChangeDelegateForm';

import { CurrentDelegate } from './CurrentDelegate';

interface StakeChangeDelegateModalProps {
    onCancel?: () => void;
    selectedAccount: SelectedAccountLoaded;
}

export const StakeChangeDelegateModalLoaded = ({
    onCancel,
    selectedAccount,
}: StakeChangeDelegateModalProps) => {
    const { account } = selectedAccount;

    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    const selectedVotingDelegation = useSelector(state =>
        selectVotingDelegationOption(state, account.key),
    );

    const { isVotingDisabled, votingMessageContent } = useMessageSystemStaking(account.symbol);

    const changeDelegateContextValues = useChangeDelegateForm({ selectedAccount });

    const { changeFeeLevel, feeInfo, composedLevels, methods, handleSubmit, signTx } =
        changeDelegateContextValues;

    const currentDrepId = getCardanoAccountDrepId(account);
    const isEverstake = currentDrepId === CARDANO_EVERSTAKE_DREP.bech32;

    // we don't want to show current delegation option in this modal
    // if it was pre-selected, select the default option instead
    useEffect(() => {
        if (selectedVotingDelegation.type !== 'current') return;

        dispatch(
            stakeActions.setAccountVotingDelegation({
                accountKey: account.key,
                option: DEFAULT_VOTING_OPTION,
            }),
        );
    }, [dispatch, selectedVotingDelegation, account.key]);

    const handleCancel = () => {
        dispatch(stakeActions.clearAccountVotingDelegation());

        onCancel?.();

        analytics.report({
            type: events.stakingChangeDelegateEvent.name,
            payload: {
                action: 'cancel',
                step: 'change-delegate-form-modal',
                networkSymbol: account.symbol,
            },
        });
    };

    const handleContinue = () => {
        handleSubmit(() => {
            analytics.report({
                type: events.stakingChangeDelegateEvent.name,
                payload: {
                    action: 'continue',
                    step: 'change-delegate-form-modal',
                    networkSymbol: account.symbol,
                },
            });

            signTx();
        })();
    };

    const { isDisabled: isSelectionInvalid, errorType } = useMemo(() => {
        switch (selectedVotingDelegation.type) {
            case 'current':
                return { isDisabled: true, errorType: 'current_delegate' as const };

            case 'everstake': {
                if (isEverstake) {
                    return { isDisabled: true, errorType: 'current_delegate' as const };
                }

                break;
            }
            case 'another_drep': {
                const { drepId } = selectedVotingDelegation;

                if (drepId === currentDrepId) {
                    return { isDisabled: true, errorType: 'current_delegate' as const };
                }

                if (!validateCardanoDrep(drepId)) {
                    return { isDisabled: true, errorType: 'invalid_drep' as const };
                }

                break;
            }
        }

        return { isDisabled: false };
    }, [selectedVotingDelegation, currentDrepId, isEverstake]);

    const isDisabled = isSelectionInvalid || isVotingDisabled;

    const tooltipContent = useMemo(() => {
        if (isVotingDisabled) {
            return votingMessageContent;
        }

        if (isSelectionInvalid && errorType === 'current_delegate') {
            return <Translation id="TR_STAKE_CHANGE_DELEGATE_DISABLED_TOOLTIP" />;
        }

        return undefined;
    }, [isVotingDisabled, votingMessageContent, isSelectionInvalid, errorType]);

    return (
        <ChangeDelegateFormContext.Provider value={changeDelegateContextValues}>
            <FormProvider {...methods}>
                <Modal
                    heading={<Translation id="TR_STAKE_CHANGE_DELEGATE" />}
                    onCancel={handleCancel}
                    bottomContent={
                        <Tooltip content={tooltipContent}>
                            <Modal.Button isDisabled={isDisabled} onClick={handleContinue}>
                                <Translation id="TR_CONTINUE" />
                            </Modal.Button>
                        </Tooltip>
                    }
                >
                    <Card>
                        <Column gap={20} hasDivider>
                            <CurrentDelegate account={account} />
                            <VotingDelegationsOptions account={account} hasTitle />

                            <Fees
                                feeInfo={feeInfo}
                                account={account}
                                composedLevels={composedLevels}
                                changeFeeLevel={changeFeeLevel}
                                headerTypographyStyle="body-sm"
                            />
                        </Column>
                    </Card>
                </Modal>
            </FormProvider>
        </ChangeDelegateFormContext.Provider>
    );
};

export const StakeChangeDelegateModal = ({
    onCancel,
}: Omit<StakeChangeDelegateModalProps, 'selectedAccount'>) => {
    const selectedAccount = useSelector(selectFullSelectedAccount);

    if (selectedAccount.status !== 'loaded' || !selectedAccount.account) {
        onCancel?.();

        return null;
    }

    return <StakeChangeDelegateModalLoaded onCancel={onCancel} selectedAccount={selectedAccount} />;
};
