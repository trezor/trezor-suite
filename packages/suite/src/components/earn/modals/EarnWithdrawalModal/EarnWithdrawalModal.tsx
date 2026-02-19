import { useEffect } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { EarnAccountRef, EarnFlow } from '@suite-common/suite-types/src/staking';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Account, SelectedAccountLoaded } from '@suite-common/wallet-types';
import { CollapsibleBox, Column, Grid, H3, Modal } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { EarnWithdrawingInfo } from 'src/components/earn';
import { WithdrawalFormContext, useWithdrawalForm } from 'src/hooks/earn/useWithdrawalForm';
import { useLayoutSize } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

import { useEarnModalAccount } from '../common/useEarnModalAccount';
import { WithdrawalButton } from './WithdrawalForm/WithdrawalButton';
import { WithdrawalForm } from './WithdrawalForm/WithdrawalForm';

type EarnWithdrawalModalProps = {
    onCancel?: () => void;
    account?: EarnAccountRef;
};

type EarnWithdrawalModalLoadedProps = {
    onCancel?: () => void;
    selectedAccount: SelectedAccountLoaded;
};

const createLoadedSelectedAccount = (account: Account): SelectedAccountLoaded => ({
    status: 'loaded',
    account,
    network: getNetwork(account.symbol),
    params: {
        symbol: account.symbol,
        accountIndex: account.index,
        accountType: account.accountType,
    },
});

export const EarnWithdrawalModalLoaded = ({
    onCancel,
    selectedAccount,
}: EarnWithdrawalModalLoadedProps) => {
    const analytics = useAnalytics();
    const { account } = selectedAccount;

    const withdrawalContextValues = useWithdrawalForm({ selectedAccount });
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
        <WithdrawalFormContext.Provider value={withdrawalContextValues}>
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
                bottomContent={<WithdrawalButton />}
            >
                <Grid columns={isBelowTablet ? 1 : 2} gap={spacings.xxl}>
                    <WithdrawalForm />
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
        </WithdrawalFormContext.Provider>
    );
};

export const EarnWithdrawalModal = ({ onCancel, account }: EarnWithdrawalModalProps) => {
    const selectedAccount = useEarnModalAccount({
        account,
        shouldSyncSelectedAccount: true,
    });

    useEffect(() => {
        if (!selectedAccount) {
            onCancel?.();
        }
    }, [selectedAccount, onCancel]);

    if (!selectedAccount) {
        return null;
    }

    const loadedSelectedAccount = createLoadedSelectedAccount(selectedAccount);

    return (
        <EarnWithdrawalModalLoaded onCancel={onCancel} selectedAccount={loadedSelectedAccount} />
    );
};
