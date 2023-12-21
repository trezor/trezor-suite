import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { ClaimEthFormContext, useClaimEthForm } from 'src/hooks/wallet/useClaimEthForm';
import { ClaimEthForm } from './ClaimEthForm';

interface ClaimModalContentProps {
    selectedAccount: SelectedAccountLoaded;
}

export const ClaimModalContent = ({ selectedAccount }: ClaimModalContentProps) => {
    const claimEthContextValues = useClaimEthForm({ selectedAccount });

    return (
        <ClaimEthFormContext.Provider value={claimEthContextValues}>
            <ClaimEthForm />
        </ClaimEthFormContext.Provider>
    );
};
