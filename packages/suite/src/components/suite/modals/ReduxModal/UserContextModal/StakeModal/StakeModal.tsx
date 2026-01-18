import { Translation } from '@suite/intl';
import { StakingFlow } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectAccountIsStakingActive } from '@suite-common/wallet-core';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Grid, Modal } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { stakingFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useLayoutSize, useSelector } from 'src/hooks/suite';
import { StakeFormContext, useStakeForm } from 'src/hooks/wallet/useStakeForm';
import { useAnalytics } from 'src/support/useAnalytics';

import { StakeButton } from './StakeForm/StakeButton';
import { StakeForm } from './StakeForm/StakeForm';
import { StakeInfoCards } from './StakeInfoCards/StakeInfoCards';

interface StakeModalModalProps {
    onCancel?: () => void;
    selectedAccount: SelectedAccountLoaded;
    flow: StakingFlow;
}

export const StakeModalLoaded = ({ onCancel, selectedAccount, flow }: StakeModalModalProps) => {
    const { account } = selectedAccount;
    const analytics = useAnalytics();
    const stakeContextValues = useStakeForm({ selectedAccount });
    const { isBelowTablet } = useLayoutSize();

    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));
    const isUpdateProviderFlow = isStakingActive && account.networkType === 'cardano';

    const onCancelClick = () => {
        onCancel?.();

        analytics.report({
            type: stakingFlowToEventTypeMap[flow],
            payload: {
                action: 'cancel',
                step: 'stake-form-modal',
                networkSymbol: account.symbol,
            },
        });
    };

    if (!stakeContextValues.stakingLimits) {
        return null;
    }

    return (
        <StakeFormContext.Provider value={stakeContextValues}>
            <Modal
                width={960}
                heading={
                    <Translation
                        id={
                            isUpdateProviderFlow
                                ? 'TR_STAKING_UPDATE_PROVIDER'
                                : 'TR_STAKE_STAKE_TOKEN'
                        }
                        values={{ symbol: getNetworkDisplaySymbol(account.symbol) }}
                    />
                }
                onCancel={onCancelClick}
                bottomContent={<StakeButton flow={flow} />}
            >
                <Grid columns={isBelowTablet ? 1 : 2} gap={spacings.xxl}>
                    <StakeForm flow={flow} />
                    <StakeInfoCards flow={flow} />
                </Grid>
            </Modal>
        </StakeFormContext.Provider>
    );
};

export const StakeModal = ({ onCancel, flow }: Pick<StakeModalModalProps, 'onCancel' | 'flow'>) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    if (selectedAccount.status !== 'loaded' || !selectedAccount.account) {
        onCancel?.();

        return null;
    }

    return (
        <StakeModalLoaded
            onCancel={onCancel}
            selectedAccount={selectedAccount as SelectedAccountLoaded}
            flow={flow}
        />
    );
};
