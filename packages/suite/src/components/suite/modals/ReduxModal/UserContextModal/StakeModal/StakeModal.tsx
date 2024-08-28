import { NewModal } from '@trezor/components';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { StakeEthFormContext, useStakeEthForm } from 'src/hooks/wallet/useStakeEthForm';
import { StakeEthForm } from './StakeEthForm/StakeEthForm';
import { StakeButton } from './StakeEthForm/StakeButton';

interface StakeModalModalProps {
    onCancel?: () => void;
}

export const StakeModal = ({ onCancel }: StakeModalModalProps) => {
    const selectedAccount = useSelector(
        state => state.wallet.selectedAccount,
    ) as SelectedAccountLoaded;
    const stakeEthContextValues = useStakeEthForm({ selectedAccount });

    const { account, status } = selectedAccount;
    // it shouldn't be possible to open this modal without having selected account
    if (!account || status !== 'loaded') return null;

    return (
        <StakeEthFormContext.Provider value={stakeEthContextValues}>
            <NewModal
                size="tiny"
                heading={<Translation id="TR_STAKE_ETH" />}
                onCancel={onCancel}
                bottomContent={<StakeButton />}
            >
                <StakeEthForm />
            </NewModal>
        </StakeEthFormContext.Provider>
    );
};
