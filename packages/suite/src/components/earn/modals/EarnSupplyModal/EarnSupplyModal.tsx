import { useEffect } from 'react';

import { Translation } from '@suite/intl';
import { EarnAccountRef, EarnFlow } from '@suite-common/suite-types/src/staking';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectAccountIsStakingActive } from '@suite-common/wallet-core';
import { Account, SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Grid, Modal } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { earnFlowToEventTypeMap } from 'src/constants/suite/staking';
import { SupplyFormContext, useSupplyForm } from 'src/hooks/earn/useSupplyForm';
import { useLayoutSize, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

import { useEarnModalAccount } from '../common/useEarnModalAccount';
import { SupplyButton } from './SupplyForm/SupplyButton';
import { SupplyForm } from './SupplyForm/SupplyForm';
import { SupplyInfoCards } from './SupplyInfoCards/SupplyInfoCards';

type EarnSupplyModalProps = {
    onCancel?: () => void;
    flow: EarnFlow;
    account?: EarnAccountRef;
    yieldId?: string;
    tokenContractAddress?: string;
};

type EarnSupplyModalLoadedProps = {
    onCancel?: () => void;
    selectedAccount: SelectedAccountLoaded;
    flow: EarnFlow;
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

const EarnStakingSupplyModalLoaded = ({
    onCancel,
    selectedAccount,
    flow,
}: EarnSupplyModalLoadedProps) => {
    const { account } = selectedAccount;
    const analytics = useAnalytics();
    const supplyContextValues = useSupplyForm({ selectedAccount });
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
                <Grid columns={isBelowTablet ? 1 : 2} gap={spacings.xxl}>
                    <SupplyForm flow={flow} account={account} />
                    <SupplyInfoCards account={account} flow={flow} />
                </Grid>
            </Modal>
        </SupplyFormContext.Provider>
    );
};

const EarnYieldSupplyModalLoaded = ({ onCancel, selectedAccount }: EarnSupplyModalLoadedProps) => {
    const analytics = useAnalytics();
    const { account } = selectedAccount;

    const onCancelClick = () => {
        onCancel?.();

        analytics.report({
            type: earnFlowToEventTypeMap[EarnFlow.Yield],
            payload: {
                action: 'cancel',
                step: 'stake-form-modal',
                networkSymbol: account.symbol,
            },
        });
    };

    return (
        <Modal
            width={600}
            heading={
                <Translation
                    id="TR_EARN_SUPPLY_TOKEN"
                    values={{ symbol: getNetworkDisplaySymbol(account.symbol) }}
                />
            }
            onCancel={onCancelClick}
            bottomContent={
                <>
                    <Modal.Button isDisabled iconLeft="info">
                        <Translation id="TR_CONTINUE" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onCancelClick}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <SupplyForm flow={EarnFlow.Yield} account={account} />
        </Modal>
    );
};

export const EarnSupplyModal = ({
    onCancel,
    flow,
    account,
    yieldId,
    tokenContractAddress,
}: EarnSupplyModalProps) => {
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

    if (flow === EarnFlow.Yield) {
        return (
            <EarnYieldSupplyModalLoaded
                onCancel={onCancel}
                selectedAccount={loadedSelectedAccount}
                flow={flow}
            />
        );
    }

    return (
        <EarnStakingSupplyModalLoaded
            onCancel={onCancel}
            selectedAccount={loadedSelectedAccount}
            flow={flow}
        />
    );
};
