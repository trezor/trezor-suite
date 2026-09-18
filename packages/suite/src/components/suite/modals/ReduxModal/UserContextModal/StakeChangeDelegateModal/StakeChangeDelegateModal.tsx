import { useLayoutEffect, useMemo } from 'react';
import { FormProvider } from 'react-hook-form';

import { selectFullSelectedAccount } from '@suite/account';
import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    CARDANO_ALWAYS_ABSTAIN_DREP_ID,
    CARDANO_EVERSTAKE_DREP,
    getCardanoAccountDrepId,
    getCardanoCurrentVotingOption,
    selectStakeVotingDelegation,
    selectVotingDelegationOption,
    stakeActions,
    validateCardanoDrep,
} from '@suite-common/wallet-core';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Card, Column, Modal, Tooltip } from '@trezor/components';

import { BASE_VOTING_PREFERENCE_OPTIONS, VotingPreferenceCard } from 'src/components/earn';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import {
    ChangeDelegateFormContext,
    useChangeDelegateForm,
} from 'src/hooks/wallet/useChangeDelegateForm';

import { CurrentVotingPreference } from './CurrentVotingPreference';

interface StakeChangeDelegateModalProps {
    onCancel?: () => void;
    selectedAccount: SelectedAccountLoaded;
}

export const StakeChangeDelegateModalLoaded = ({
    onCancel,
    selectedAccount,
}: StakeChangeDelegateModalProps) => {
    const { account } = selectedAccount;

    const { analytics, dispatch } = useServices(selectDesktopAnalyticsDep, selectDispatch);

    const selectedVotingDelegation = useSelector(state =>
        selectVotingDelegationOption(state, account.key),
    );

    const { isVotingDisabled, votingMessageContent } = useMessageSystemStaking(account.symbol);

    const changeDelegateContextValues = useChangeDelegateForm({ selectedAccount });

    const {
        changeFeeLevel,
        feeInfo,
        composedLevels,
        selectedFee,
        isComposing,
        methods,
        handleSubmit,
        signTx,
    } = changeDelegateContextValues;

    const currentDrepId = getCardanoAccountDrepId(account);
    const isEverstake = currentDrepId === CARDANO_EVERSTAKE_DREP.bech32;

    const currentVotingOption = useMemo(() => getCardanoCurrentVotingOption(account), [account]);

    const isSelectionConfirmedForAccount = useSelector(
        state => selectStakeVotingDelegation(state)?.accountKey === account.key,
    );

    useLayoutEffect(() => {
        if (isSelectionConfirmedForAccount) return;

        dispatch(
            stakeActions.setAccountVotingDelegation({
                accountKey: account.key,
                option: { type: 'current' },
            }),
        );
    }, [dispatch, isSelectionConfirmedForAccount, account.key]);

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
                return { isDisabled: true };

            case 'abstain': {
                if (currentDrepId === CARDANO_ALWAYS_ABSTAIN_DREP_ID) {
                    return { isDisabled: true, errorType: 'current_delegate' as const };
                }

                break;
            }
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

    const isDisabled =
        isSelectionInvalid || isVotingDisabled || composedLevels?.[selectedFee]?.type !== 'final';

    const tooltipContent = useMemo(() => {
        if (isVotingDisabled) {
            return votingMessageContent;
        }

        if (isSelectionInvalid && errorType === 'current_delegate') {
            return <Translation id="TR_STAKE_CHANGE_DELEGATE_DISABLED_TOOLTIP" />;
        }

        return undefined;
    }, [isVotingDisabled, votingMessageContent, isSelectionInvalid, errorType]);

    const options = useMemo(
        () =>
            BASE_VOTING_PREFERENCE_OPTIONS.filter(
                option =>
                    option.type === 'another_drep' || option.type !== currentVotingOption?.type,
            ),
        [currentVotingOption?.type],
    );

    return (
        <ChangeDelegateFormContext.Provider value={changeDelegateContextValues}>
            <FormProvider {...methods}>
                <Modal
                    heading={<Translation id="TR_STAKING_CHANGE_VOTING_PREFERENCE" />}
                    onCancel={handleCancel}
                    bottomContent={
                        <Tooltip content={tooltipContent}>
                            <Modal.Button
                                isDisabled={isDisabled}
                                isLoading={isComposing}
                                onClick={handleContinue}
                            >
                                <Translation id="TR_CONTINUE" />
                            </Modal.Button>
                        </Tooltip>
                    }
                >
                    <Column gap={16}>
                        <CurrentVotingPreference account={account} />
                        <VotingPreferenceCard
                            account={account}
                            heading={<Translation id="TR_STAKING_NEW_PREFERENCE" />}
                            description={
                                <Translation
                                    id="TR_STAKING_NEW_PREFERENCE_DESCRIPTION"
                                    values={{
                                        displaySymbol: getNetworkDisplaySymbol(account.symbol),
                                    }}
                                />
                            }
                            options={options}
                        />
                        <Card type="raised" paddingType="small">
                            <Fees
                                feeInfo={feeInfo}
                                account={account}
                                composedLevels={composedLevels}
                                changeFeeLevel={changeFeeLevel}
                                headerTypographyStyle="body-sm"
                            />
                        </Card>
                    </Column>
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
