import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { CollapsibleBox, Column, Grid, H3, Modal } from '@trezor/components';

import { WithdrawalFormContext, useWithdrawalForm } from 'src/hooks/earn/useWithdrawalForm';
import { useLayoutSize } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

import { WithdrawalButton } from './WithdrawalForm/WithdrawalButton';
import { WithdrawalForm } from './WithdrawalForm/WithdrawalForm';
import { EarnWithdrawingInfo } from '../EarnInANutshell/components/EarnWithdrawingInfo';

type EarnWithdrawalModalProps = {
    onCancel?: () => void;
    account: Account;
};

export const EarnWithdrawalModal = ({ onCancel, account }: EarnWithdrawalModalProps) => {
    const analytics = useAnalytics();
    const withdrawalContextValues = useWithdrawalForm({ account });
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
                <Grid columns={isBelowTablet ? 1 : 2} gap={32}>
                    <WithdrawalForm />
                    <Column gap={20}>
                        <CollapsibleBox
                            heading={
                                <H3 typographyStyle="body-md-strong">
                                    <Translation id="TR_EARN_UNSTAKING_PROCESS" />
                                </H3>
                            }
                            hasDivider={false}
                            defaultIsOpen
                        >
                            <EarnWithdrawingInfo
                                account={account}
                                flow={EarnFlow.Stake}
                                isExpanded
                            />
                        </CollapsibleBox>
                    </Column>
                </Grid>
            </Modal>
        </WithdrawalFormContext.Provider>
    );
};
