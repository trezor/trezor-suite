import React from 'react';
import { WalletLayout, WalletLayoutHeader } from '@wallet-components';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { EthereumStakeFormAmount } from './EthereumStakeFormAmount';
import { StakeFormContext, useStakeForm, useStakeFormContext } from '@wallet-hooks/useStakeForm';
import { Card, Translation } from '@suite-components';
import styled from 'styled-components';
import { Button, variables } from '@trezor/components';
import { TotalTxWithFee } from '@wallet-views/TotalTxWithFee';
import { FeesWrapper } from '@wallet-views/FeesWrapper';

const StyledCard = styled(Card)`
    display: flex;
    margin-bottom: 8px;
    padding: 32px 42px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 32px 20px;
    }
`;

interface EthereumStakeFormProps {
    selectedAccount: SelectedAccountLoaded;
    onClose?: () => void;
}

export const EthereumStakeForm = ({ selectedAccount, onClose }: EthereumStakeFormProps) => {
    const sendContextValues = useStakeForm({ selectedAccount });

    const { formState, handleClearFormButtonClick } = sendContextValues;

    return (
        <StakeFormContext.Provider value={sendContextValues}>
            <WalletLayout title="TR_NAV_STAKING" account={selectedAccount}>
                <WalletLayoutHeader
                    title="TR_NAV_STAKING"
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
                <StyledCard>
                    <EthereumStakeFormAmount />
                </StyledCard>
                <FeesWrapper useContext={useStakeFormContext} />
                <TotalTxWithFee useContext={useStakeFormContext} />
            </WalletLayout>
        </StakeFormContext.Provider>
    );
};
