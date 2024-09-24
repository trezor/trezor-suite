import { Grid, NewModal, useMediaQuery, variables } from '@trezor/components';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { StakeEthFormContext, useStakeEthForm } from 'src/hooks/wallet/useStakeEthForm';
import { StakeEthForm } from './StakeEthForm/StakeEthForm';
import { StakeButton } from './StakeEthForm/StakeButton';
import { StakingInfoCards } from './StakingInfoCards/StakingInfoCards';
import { spacings } from '@trezor/theme';

interface StakeModalModalProps {
    onCancel?: () => void;
}

export const StakeModal = ({ onCancel }: StakeModalModalProps) => {
    const selectedAccount = useSelector(
        state => state.wallet.selectedAccount,
    ) as SelectedAccountLoaded;
    const stakeEthContextValues = useStakeEthForm({ selectedAccount });
    const isBelowTablet = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.MD})`);

    const { account, status } = selectedAccount;
    // it shouldn't be possible to open this modal without having selected account
    if (!account || status !== 'loaded') return null;

    return (
        <StakeEthFormContext.Provider value={stakeEthContextValues}>
            <NewModal
                size="large"
                heading={<Translation id="TR_STAKE_ETH" />}
                onCancel={onCancel}
                bottomContent={<StakeButton />}
            >
                <Grid columns={isBelowTablet ? 1 : 2} gap={spacings.lg}>
                    <StakeEthForm />
                    <StakingInfoCards />
                </Grid>
            </NewModal>
        </StakeEthFormContext.Provider>
    );
};
