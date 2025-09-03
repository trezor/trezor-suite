import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Grid, Modal } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useLayoutSize, useSelector } from 'src/hooks/suite';
import { StakeFormContext, useStakeForm } from 'src/hooks/wallet/useStakeForm';

import { StakeButton } from './StakeForm/StakeButton';
import { StakeForm } from './StakeForm/StakeForm';
import { StakeInfoCards } from './StakeInfoCards/StakeInfoCards';

interface StakeModalModalProps {
    onCancel?: () => void;
    selectedAccount: SelectedAccountLoaded;
}

export const StakeModalLoaded = ({ onCancel, selectedAccount }: StakeModalModalProps) => {
    const { account } = selectedAccount;

    const stakeContextValues = useStakeForm({ selectedAccount });
    const { isBelowTablet } = useLayoutSize();

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
        <StakeFormContext.Provider value={stakeContextValues}>
            <Modal
                size="huge"
                heading={
                    <Translation
                        id="TR_STAKE_STAKE_TOKEN"
                        values={{ symbol: getNetworkDisplaySymbol(account.symbol) }}
                    />
                }
                onCancel={onCancelClick}
                bottomContent={<StakeButton />}
            >
                <Grid columns={isBelowTablet ? 1 : 2} gap={spacings.xxl}>
                    <StakeForm />
                    <StakeInfoCards />
                </Grid>
            </Modal>
        </StakeFormContext.Provider>
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
