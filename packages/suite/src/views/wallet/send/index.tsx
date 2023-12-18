import { ReactNode } from 'react';
import styled from 'styled-components';
import { Warning } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { WalletLayout } from 'src/components/wallet';
import { useSendForm, SendContext, UseSendFormProps } from 'src/hooks/wallet/useSendForm';
import { Header } from './components/Header';
import { Outputs } from './components/Outputs';
import { Options } from './components/Options/Options';
import { SendFees } from './components/SendFees';
import { TotalSent } from './components/TotalSent';
import { Raw } from './components/Raw';
import {
    selectTargetAnonymityByAccountKey,
    selectRegisteredUtxosByAccountKey,
} from 'src/reducers/wallet/coinjoinReducer';
import { Translation } from 'src/components/suite';
import { spacingsPx } from '@trezor/theme';
import { breakpointMediaQueries } from '@trezor/styles';

const SendLayout = styled(WalletLayout)`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.md};
`;

const FormGrid = styled.div`
    display: grid;
    grid-template-columns: minmax(500px, auto) minmax(400px, 420px);
    gap: ${spacingsPx.md};

    > :not(:last-child) {
        grid-column: 1;
    }

    > :last-child {
        grid-column: 2;
        grid-row: 1;
    }

    ${breakpointMediaQueries.below_xl} {
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
        fiat: state.wallet.fiat,
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
            <WalletLayout title="TR_NAV_SEND" account={selectedAccount}>
                <Raw network={selectedAccount.network} />
            </WalletLayout>
        );
    }

    return (
        <SendLayout title="TR_NAV_SEND" account={selectedAccount}>
            <SendContext.Provider value={sendContextValues}>
                <Header />

                <FormGrid data-test="@wallet/send/outputs-and-options">
                    <Outputs disableAnim={!!children} />
                    <Options />
                    <SendFees />

                    {symbol === 'dsol' && (
                        <Warning withIcon>
                            <Translation id="TR_SOLANA_DEVNET_SHORTCUT_WARNING" />
                        </Warning>
                    )}

                    <TotalSent />
                </FormGrid>

                {children}
            </SendContext.Provider>
        </SendLayout>
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
