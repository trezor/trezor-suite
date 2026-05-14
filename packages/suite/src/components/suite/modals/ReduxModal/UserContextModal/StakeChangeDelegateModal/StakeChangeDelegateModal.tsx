import { useMemo } from 'react';
import { FormProvider } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { CARDANO_EVERSTAKE_DREP } from '@suite-common/wallet-constants';
import {
    DEFAULT_VOTING_OPTION,
    type VotingDelegationOption,
    selectVotingDelegationOption,
    stakeActions,
} from '@suite-common/wallet-core';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { validateCardanoDrep } from '@suite-common/wallet-utils';
import { Card, Column, Modal, Tooltip } from '@trezor/components';

import { VotingDelegationsOptions } from 'src/components/earn';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useDispatch, useSelector } from 'src/hooks/suite';
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
    const dispatch = useDispatch();
    const selectedVotingDelegation = useSelector(selectVotingDelegationOption);

    const { account } = selectedAccount;

    const changeDelegateContextValues = useChangeDelegateForm({ selectedAccount });

    const { changeFeeLevel, feeInfo, composedLevels, methods, handleSubmit, signTx } =
        changeDelegateContextValues;

    const currentDrepId =
        account.networkType === 'cardano' ? account?.misc?.staking.drep?.drep_id : undefined;
    const isEverstake = currentDrepId === CARDANO_EVERSTAKE_DREP.bech32;

    const drepIdOptionValue: undefined | VotingDelegationOption = useMemo(() => {
        if (!currentDrepId) return;

        if (isEverstake) {
            return { type: 'everstake' };
        }

        return { type: 'another_drep', drepId: currentDrepId };
    }, [currentDrepId, isEverstake]);

    const handleCancel = () => {
        dispatch(stakeActions.setVotingDelegationOption(DEFAULT_VOTING_OPTION));

        onCancel?.();
    };

    const { isDisabled, errorType } = useMemo(() => {
        switch (selectedVotingDelegation.type) {
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

    return (
        <ChangeDelegateFormContext.Provider value={changeDelegateContextValues}>
            <FormProvider {...methods}>
                <Modal
                    heading={<Translation id="TR_STAKE_CHANGE_DELEGATE" />}
                    onCancel={handleCancel}
                    bottomContent={
                        <Tooltip
                            isActive={isDisabled && errorType === 'current_delegate'}
                            content={<Translation id="TR_STAKE_CHANGE_DELEGATE_DISABLED_TOOLTIP" />}
                        >
                            <Modal.Button
                                isDisabled={isDisabled}
                                onClick={() => handleSubmit(signTx)()}
                            >
                                <Translation id="TR_CONTINUE" />
                            </Modal.Button>
                        </Tooltip>
                    }
                >
                    <Card>
                        <Column gap={20} hasDivider>
                            <CurrentDelegate account={account} />
                            <VotingDelegationsOptions
                                networkType={account.networkType}
                                initialValue={drepIdOptionValue}
                                hasTitle
                                resetOnMount
                            />

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
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    if (selectedAccount.status !== 'loaded' || !selectedAccount.account) {
        onCancel?.();

        return null;
    }

    return (
        <StakeChangeDelegateModalLoaded
            onCancel={onCancel}
            selectedAccount={selectedAccount as SelectedAccountLoaded}
        />
    );
};
