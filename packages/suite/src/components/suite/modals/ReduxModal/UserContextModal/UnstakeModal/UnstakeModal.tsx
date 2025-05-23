import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { CollapsibleBox, Column, Grid, H3, Modal } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { UnstakingInfo } from 'src/components/suite/StakingProcess/UnstakingInfo';
import { useLayoutSize, useSelector } from 'src/hooks/suite';
import { UnstakeEthFormContext, useUnstakeEthForm } from 'src/hooks/wallet/useUnstakeEthForm';

import { UnstakeButton } from './UnstakeEthForm/UnstakeButton';
import { UnstakeEthForm } from './UnstakeEthForm/UnstakeEthForm';

interface UnstakeModalModalProps {
    onCancel?: () => void;
    selectedAccount: SelectedAccountLoaded;
}

export const UnstakeModalLoaded = ({ onCancel, selectedAccount }: UnstakeModalModalProps) => {
    const { account } = selectedAccount;

    const unstakeEthContextValues = useUnstakeEthForm({ selectedAccount });
    const { isBelowTablet } = useLayoutSize();

    const onCancelClick = () => {
        onCancel?.();

        analytics.report({
            type: EventType.StakingUnstake,
            payload: {
                action: 'cancel',
                step: 'unstake-form-modal',
                networkSymbol: account.symbol,
            },
        });
    };

    return (
        <UnstakeEthFormContext.Provider value={unstakeEthContextValues}>
            <Modal
                size="huge"
                heading={<Translation id="TR_STAKE_UNSTAKE" />}
                description={<Translation id="TR_STAKE_CLAIM_AFTER_UNSTAKING" />}
                onCancel={onCancelClick}
                bottomContent={<UnstakeButton />}
            >
                <Grid columns={isBelowTablet ? 1 : 2} gap={spacings.xxl}>
                    <UnstakeEthForm />
                    <Column gap={spacings.lg}>
                        <CollapsibleBox
                            heading={
                                <H3 typographyStyle="highlight">
                                    <Translation id="TR_STAKE_UNSTAKING_PROCESS" />
                                </H3>
                            }
                            hasDivider={false}
                            defaultIsOpen
                        >
                            <UnstakingInfo isExpanded />
                        </CollapsibleBox>
                    </Column>
                </Grid>
            </Modal>
        </UnstakeEthFormContext.Provider>
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
