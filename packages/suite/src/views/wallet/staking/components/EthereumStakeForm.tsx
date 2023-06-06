import React from 'react';
import { WalletLayout, WalletLayoutHeader } from '@wallet-components';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { EthereumStakeFormAmount } from './EthereumStakeFormAmount';
import { StakeFormContext, useStakeForm, useStakeFormContext } from '@wallet-hooks/useStakeForm';
import { Translation } from '@suite-components';
import { Button } from '@trezor/components';
import { TotalTxWithFee } from '@wallet-views/TotalTxWithFee';
import { FeesWrapper } from '@wallet-views/FeesWrapper';
import { EthereumStakeFormButton } from './EthereumStakeFormButton';

interface EthereumStakeFormProps {
    selectedAccount: SelectedAccountLoaded;
    onClose?: () => void;
    stakeFormState: 'stake' | 'withdraw' | 'claim';
}

export const EthereumStakeForm = ({
    selectedAccount,
    onClose,
    stakeFormState,
}: EthereumStakeFormProps) => {
    const sendContextValues = useStakeForm({ selectedAccount });

    const { formState, handleClearFormButtonClick } = sendContextValues;

    return (
        <StakeFormContext.Provider value={sendContextValues}>
            <WalletLayout
                // @ts-expect-error
                title={`TR_STAKE_${stakeFormState.toUpperCase()}`}
                account={selectedAccount}
            >
                <WalletLayoutHeader
                    // @ts-expect-error
                    title={`TR_STAKE_${stakeFormState.toUpperCase()}`}
                    routeName="wallet-staking"
                    onClose={onClose}
                >
                    {formState.isDirty && (
                        <Button
                            type="button"
                            variant="tertiary"
                            onClick={handleClearFormButtonClick}
                        >
                            <Translation id="TR_CLEAR_ALL" />
                        </Button>
                    )}
                </WalletLayoutHeader>
                <EthereumStakeFormAmount />
                <FeesWrapper useContext={useStakeFormContext} />
                <TotalTxWithFee useContext={useStakeFormContext} />
                <EthereumStakeFormButton />
            </WalletLayout>
        </StakeFormContext.Provider>
    );
};
