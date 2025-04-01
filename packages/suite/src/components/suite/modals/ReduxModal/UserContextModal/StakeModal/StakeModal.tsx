import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Grid, NewModal, useMediaQuery, variables } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { StakeEthFormContext, useStakeEthForm } from 'src/hooks/wallet/useStakeEthForm';

import { StakeButton } from './StakeEthForm/StakeButton';
import { StakeEthForm } from './StakeEthForm/StakeEthForm';
import { StakingInfoCards } from './StakingInfoCards/StakingInfoCards';

interface StakeModalModalProps {
    onCancel?: () => void;
    selectedAccount: SelectedAccountLoaded;
}

export const StakeModalLoaded = ({ onCancel, selectedAccount }: StakeModalModalProps) => {
    const { account } = selectedAccount;

    const stakeEthContextValues = useStakeEthForm({ selectedAccount });
    const isBelowTablet = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.MD})`);

    const onCancelClick = () => {
        onCancel?.();

        analytics.report({
            type: EventType.StakingStake,
            payload: {
                action: 'cancel',
                step: 'stake-form-modal',
                networkSymbol: account.symbol,
            },
        });
    };

    return (
        <StakeEthFormContext.Provider value={stakeEthContextValues}>
            <NewModal
                size="huge"
                heading={
                    <Translation
                        id="TR_STAKE_NETWORK"
                        values={{ symbol: account.symbol.toUpperCase() }}
                    />
                }
                onCancel={onCancelClick}
                bottomContent={<StakeButton />}
            >
                <Grid columns={isBelowTablet ? 1 : 2} gap={spacings.xxl}>
                    <StakeEthForm />
                    <StakingInfoCards />
                </Grid>
            </NewModal>
        </StakeEthFormContext.Provider>
    );
};

export const StakeModal = ({ onCancel }: Omit<StakeModalModalProps, 'selectedAccount'>) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    if (selectedAccount.status !== 'loaded' || !selectedAccount.account) {
        onCancel?.();

        return null;
    }

    return (
        <StakeModalLoaded
            onCancel={onCancel}
            selectedAccount={selectedAccount as SelectedAccountLoaded}
        />
    );
};
