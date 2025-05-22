import { ReactNode } from 'react';

import styled from 'styled-components';

import { Banner, Column } from '@trezor/components';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { spacings, spacingsPx } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { ConfirmEvmExplanationModal } from 'src/components/suite/modals';
import { WalletLayout } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
import { SendContext, UseSendFormProps, useSendForm } from 'src/hooks/wallet/useSendForm';
import {
    selectRegisteredUtxosByAccountKey,
    selectTargetAnonymityByAccountKey,
} from 'src/reducers/wallet/coinjoinReducer';

import { Options } from './Options/Options';
import { Outputs } from './Outputs/Outputs';
import { SendFees } from './SendFees';
import { SendHeader } from './SendHeader';
import { SendRaw } from './SendRaw';
import { TotalSent } from './TotalSent/TotalSent';

const FormGrid = styled.div`
    gap: ${spacingsPx.md};

    ${SCREEN_QUERY.ABOVE_DESKTOP} {
        display: grid;
        grid-template-columns: minmax(500px, auto) minmax(340px, 420px);

        > :not(:last-child) {
            grid-column: 1;
        }

        > :last-child {
            grid-column: 2;
            grid-row: 1;
        }
    }

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        display: flex;
        flex-direction: column;
    }
`;

interface SendProps {
    children: ReactNode;
}

interface SendLoadedProps extends SendProps {
    selectedAccount: UseSendFormProps['selectedAccount'];
}

// inner component for selectedAccount.status = "loaded"
// separated to call `useSendForm` hook at top level
// children are only for test purposes, this prop is not available in regular build
const SendLoaded = ({ children, selectedAccount }: SendLoadedProps) => {
    const props = useSelector(state => ({
        localCurrency: state.wallet.settings.localCurrency,
        fees: state.wallet.fees,
        online: state.suite.online,
        sendRaw: state.wallet.send.sendRaw,
        metadataEnabled: state.metadata.enabled && !!state.metadata.providers[0],
        targetAnonymity: selectTargetAnonymityByAccountKey(state, selectedAccount.account.key),
        prison: selectRegisteredUtxosByAccountKey(state, selectedAccount.account.key),
    }));

    const sendContextValues = useSendForm({ ...props, selectedAccount });

    const { symbol } = selectedAccount.account;

    if (props.sendRaw) {
        return (
            <WalletLayout title="TR_NAV_SEND" isSubpage account={selectedAccount}>
                <SendRaw account={selectedAccount.account} />
            </WalletLayout>
        );
    }

    return (
        <WalletLayout title="TR_NAV_SEND" isSubpage account={selectedAccount}>
            <SendContext.Provider value={sendContextValues}>
                <Column gap={spacings.xl}>
                    <SendHeader />

                    <FormGrid data-testid="@wallet/send/outputs-and-options">
                        <Outputs disableAnim={!!children} />
                        <Options />
                        <SendFees />

                        {symbol === 'dsol' && (
                            <Banner icon>
                                <Translation id="TR_SOLANA_DEVNET_SHORTCUT_WARNING" />
                            </Banner>
                        )}

                        <TotalSent />
                    </FormGrid>
                </Column>

                {children}
            </SendContext.Provider>

            <ConfirmEvmExplanationModal account={selectedAccount.account} route="wallet-send" />
        </WalletLayout>
    );
};

const Send = ({ children }: SendProps) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_SEND" account={selectedAccount} />;
    }

    /* children are only for test purposes, this prop is not available in regular build */
    return <SendLoaded selectedAccount={selectedAccount}>{children}</SendLoaded>;
};

export default Send;
