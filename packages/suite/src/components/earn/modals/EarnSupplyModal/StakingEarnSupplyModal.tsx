import { Translation } from '@suite/intl';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectAccountIsStakingActive } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { Grid, Modal } from '@trezor/components';

import { earnFlowToEventTypeMap } from 'src/constants/suite/staking';
import { SupplyFormContext, useSupplyForm } from 'src/hooks/earn/useSupplyForm';
import { useLayoutSize, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

import { SupplyButton } from './SupplyForm/SupplyButton';
import { SupplyForm } from './SupplyForm/SupplyForm';
import { SupplyInfoCards } from './SupplyInfoCards/SupplyInfoCards';

type StakingEarnSupplyModalProps = {
    onCancel?: () => void;
    account: Account;
    flow: EarnFlow;
};

export const StakingEarnSupplyModal = ({
    onCancel,
    account,
    flow,
}: StakingEarnSupplyModalProps) => {
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
                bottomContent={<SupplyButton flow={flow} />}
            >
                <Grid columns={isBelowTablet ? 1 : 2} gap={32}>
                    <SupplyForm flow={flow} account={account} />
                    <SupplyInfoCards account={account} flow={flow} />
                </Grid>
            </Modal>
        </SupplyFormContext.Provider>
    );
};
