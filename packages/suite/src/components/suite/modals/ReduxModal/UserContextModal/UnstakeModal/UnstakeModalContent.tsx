import { UnstakeEthFormContext, useUnstakeEthForm } from 'src/hooks/wallet/useUnstakeEthForm';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { UnstakeEthForm } from './UnstakeEthForm';

interface UnstakeModalContentProps {
    selectedAccount: SelectedAccountLoaded;
}

export const UnstakeModalContent = ({ selectedAccount }: UnstakeModalContentProps) => {
    const unstakeEthContextValues = useUnstakeEthForm({ selectedAccount });

    return (
        <UnstakeEthFormContext.Provider value={unstakeEthContextValues}>
            <UnstakeEthForm />
        </UnstakeEthFormContext.Provider>
    );
};
