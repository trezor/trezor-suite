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

    const onCancelClick = () => {
        onCancel?.();

        analytics.report({
            type: EventType.StakingStake,
            payload: {
                action: 'cancel',
                step: 'stake-form-modal',
                networkSymbol: selectedAccount.account.symbol,
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
