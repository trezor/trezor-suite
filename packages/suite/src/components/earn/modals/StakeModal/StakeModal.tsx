import { Translation } from '@suite/intl';
import { type StakeModalFlow } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectAccountIsStakingActive } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Grid, Modal } from '@trezor/components';

import { earnFlowToEventTypeMap } from 'src/constants/suite/staking';
import { SupplyFormContext, useSupplyForm } from 'src/hooks/earn/useSupplyForm';
import { useLayoutSize, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

import { StakeButton } from './StakeForm/StakeButton';
import { StakeForm } from './StakeForm/StakeForm';
import { StakeInfoCards } from './StakeInfoCards/StakeInfoCards';

type StakeModalProps = {
    onCancel?: () => void;
    account: Account;
    flow: StakeModalFlow;
};

export const StakeModal = ({ onCancel, account, flow }: StakeModalProps) => {
    const analytics = useAnalytics();
    const supplyContextValues = useSupplyForm({ account });
    const { isBelowTablet } = useLayoutSize();

    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));
    const isUpdateProviderFlow = isStakingActive && account.networkType === 'cardano';

    const onCancelClick = () => {
        onCancel?.();

        analytics.report({
            type: earnFlowToEventTypeMap[flow],
            payload: {
                action: 'cancel',
                step: 'stake-form-modal',
                networkSymbol: account.symbol,
            },
        });
    };

    if (!supplyContextValues.stakingLimits) {
        return null;
    }

    return (
        <SupplyFormContext.Provider value={supplyContextValues}>
            <Modal
                width={960}
                heading={
                    <Translation
                        id={
                            isUpdateProviderFlow ? 'TR_EARN_UPDATE_PROVIDER' : 'TR_EARN_STAKE_TOKEN'
                        }
                        values={{ symbol: getNetworkDisplaySymbol(account.symbol) }}
                    />
                }
                onCancel={onCancelClick}
                bottomContent={<StakeButton flow={flow} />}
            >
                <Grid columns={isBelowTablet ? 1 : 2} gap={32}>
                    <StakeForm flow={flow} />
                    <StakeInfoCards account={account} flow={flow} />
                </Grid>
            </Modal>
        </SupplyFormContext.Provider>
    );
};
