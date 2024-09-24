import { useSelector } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import {
    Card,
    CollapsibleBox,
    Column,
    Grid,
    H3,
    List,
    NewModal,
    useMediaQuery,
    variables,
} from '@trezor/components';
import { spacings } from '@trezor/theme';
import { UnstakingInfo } from 'src/components/suite/StakingProcess/UnstakingInfo';
import { UnstakeButton } from './UnstakeEthForm/UnstakeButton';
import { UnstakeEthFormContext, useUnstakeEthForm } from 'src/hooks/wallet/useUnstakeEthForm';
import { UnstakeEthForm } from './UnstakeEthForm/UnstakeEthForm';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';

interface UnstakeModalModalProps {
    onCancel?: () => void;
}

export const UnstakeModal = ({ onCancel }: UnstakeModalModalProps) => {
    const selectedAccount = useSelector(
        state => state.wallet.selectedAccount,
    ) as SelectedAccountLoaded;
    const unstakeEthContextValues = useUnstakeEthForm({ selectedAccount });
    const isBelowTablet = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.MD})`);

    const { account, status } = selectedAccount;
    // it shouldn't be possible to open this modal without having selected account
    if (!account || status !== 'loaded') return null;

    return (
        <UnstakeEthFormContext.Provider value={unstakeEthContextValues}>
            <NewModal
                size="large"
                heading={<Translation id="TR_STAKE_UNSTAKE" />}
                description={<Translation id="TR_STAKE_CLAIM_AFTER_UNSTAKING" />}
                onCancel={onCancel}
                bottomContent={<UnstakeButton />}
            >
                <Grid columns={isBelowTablet ? 1 : 2} gap={spacings.lg}>
                    <UnstakeEthForm />
                    <Column gap={spacings.sm} alignItems="normal">
                        <Card paddingType="small">
                            <CollapsibleBox
                                heading={
                                    <H3 typographyStyle="highlight">
                                        <Translation id="TR_STAKE_UNSTAKING_PROCESS" />
                                    </H3>
                                }
                                fillType="none"
                                paddingType="none"
                                hasDivider={false}
                                defaultIsOpen
                            >
                                <List isOrdered bulletGap={spacings.sm} gap={spacings.md}>
                                    <UnstakingInfo isExpanded />
                                </List>
                            </CollapsibleBox>
                        </Card>
                    </Column>
                </Grid>
            </NewModal>
        </UnstakeEthFormContext.Provider>
    );
};
