import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { CollapsibleBox, Column, Grid, H3, Modal } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { EarnWithdrawingInfo } from 'src/components/earn';
import { useLayoutSize, useSelector } from 'src/hooks/suite';
import { UnstakeFormContext, useUnstakeForm } from 'src/hooks/wallet/useUnstakeForm';
import { useAnalytics } from 'src/support/useAnalytics';

import { UnstakeButton } from './UnstakeForm/UnstakeButton';
import { UnstakeForm } from './UnstakeForm/UnstakeForm';

interface UnstakeModalModalProps {
    onCancel?: () => void;
    selectedAccount: SelectedAccountLoaded;
}

export const UnstakeModalLoaded = ({ onCancel, selectedAccount }: UnstakeModalModalProps) => {
    const analytics = useAnalytics();
    const { account } = selectedAccount;

    const unstakeContextValues = useUnstakeForm({ selectedAccount });
    const { isBelowTablet } = useLayoutSize();

    const onCancelClick = () => {
        onCancel?.();

        analytics.report({
            type: events.stakingUnstakeEvent.name,
            payload: {
                action: 'cancel',
                step: 'unstake-form-modal',
                networkSymbol: account.symbol,
            },
        });
    };

    return (
        <UnstakeFormContext.Provider value={unstakeContextValues}>
            <Modal
                width={960}
                heading={
                    <Translation
                        id="TR_STAKE_UNSTAKE_TOKEN"
                        values={{ symbol: getNetworkDisplaySymbol(account.symbol) }}
                    />
                }
                description={
                    account.networkType === 'cardano' ? (
                        <Translation id="TR_STAKE_UNSTAKE_WITH_REWARDS" />
                    ) : (
                        <Translation id="TR_STAKE_CLAIM_AFTER_UNSTAKING" />
                    )
                }
                onCancel={onCancelClick}
                bottomContent={<UnstakeButton />}
            >
                <Grid columns={isBelowTablet ? 1 : 2} gap={spacings.xxl}>
                    <UnstakeForm />
                    <Column gap={spacings.lg}>
                        <CollapsibleBox
                            heading={
                                <H3 typographyStyle="body-md-strong">
                                    <Translation id="TR_EARN_UNSTAKING_PROCESS" />
                                </H3>
                            }
                            hasDivider={false}
                            defaultIsOpen
                        >
                            <EarnWithdrawingInfo flow={EarnFlow.Stake} isExpanded />
                        </CollapsibleBox>
                    </Column>
                </Grid>
            </Modal>
        </UnstakeFormContext.Provider>
    );
};

export const UnstakeModal = ({ onCancel }: Omit<UnstakeModalModalProps, 'selectedAccount'>) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    if (selectedAccount.status !== 'loaded' || !selectedAccount.account) {
        onCancel?.();

        return null;
    }

    return (
        <UnstakeModalLoaded
            onCancel={onCancel}
            selectedAccount={selectedAccount as SelectedAccountLoaded}
        />
    );
};
