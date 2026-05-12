import { type ReactNode } from 'react';
import { FormProvider } from 'react-hook-form';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectIsMetadataProviderConnected } from '@suite/metadata';
import { selectRouteName } from '@suite/router';
import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { selectBaseCurrency, selectFees, selectSendRaw } from '@suite-common/wallet-core';
import { Banner, Column } from '@trezor/components';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { spacings, spacingsPx } from '@trezor/theme';

import { ConfirmEvmExplanationModal } from 'src/components/suite/modals/ConfirmEvmExplanationModal';
import { WalletLayout } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
import { SendContext, type UseSendFormProps, useSendForm } from 'src/hooks/wallet/useSendForm';
import {
    selectRegisteredUtxosByAccountKey,
    selectTargetAnonymityByAccountKey,
} from 'src/reducers/wallet/coinjoinReducer';
import { selectFullSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { selectIsSuiteOnline } from 'src/selectors/suite/suiteSelectors';

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
    children?: ReactNode;
}

interface SendLoadedProps extends SendProps {
    selectedAccount: UseSendFormProps['selectedAccount'];
}

// inner component for selectedAccount.status = "loaded"
// separated to call `useSendForm` hook at top level
// children are only for test purposes, this prop is not available in regular build
const SendLoaded = ({ children, selectedAccount }: SendLoadedProps) => {
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const accountKey = selectedAccount.account.key;

    const localCurrency = useSelector(selectBaseCurrency);
    const fees = useSelector(selectFees);
    const online = useSelector(selectIsSuiteOnline);
    const sendRaw = useSelector(selectSendRaw);
    const isMetadataProviderConnected = useSelector(selectIsMetadataProviderConnected);
    const metadataEnabled = isMetadataProviderConnected || isSuiteSyncEnabled;
    const targetAnonymity = useSelector(state =>
        selectTargetAnonymityByAccountKey(state, accountKey),
    );
    const prison = useSelector(state => selectRegisteredUtxosByAccountKey(state, accountKey));

    const sendContextValues = useSendForm({
        selectedAccount,
        localCurrency,
        fees,
        online,
        sendRaw,
        metadataEnabled,
        targetAnonymity,
        prison,
    });

    const { symbol } = selectedAccount.account;
    if (sendRaw) {
        return (
            <WalletLayout title="TR_NAV_SEND" isSubpage account={selectedAccount}>
                <SendRaw account={selectedAccount.account} />
            </WalletLayout>
        );
    }

    return (
        <WalletLayout title="TR_NAV_SEND" isSubpage account={selectedAccount}>
            <SendContext.Provider value={sendContextValues}>
                <FormProvider {...sendContextValues.methods}>
                    <Column gap={spacings.xl}>
                        <SendHeader />

                        <FormGrid data-testid="@wallet/send/outputs-and-options">
                            <Outputs disableAnim={!!children} />
                            <Options />
                            <SendFees />

                            {symbol === 'dsol' && (
                                <Banner
                                    icon
                                    description={
                                        <Translation id="TR_SOLANA_DEVNET_SHORTCUT_WARNING" />
                                    }
                                />
                            )}

                            <TotalSent />
                        </FormGrid>
                    </Column>

                    {children}
                </FormProvider>
            </SendContext.Provider>

            <ConfirmEvmExplanationModal account={selectedAccount.account} route="wallet-send" />
        </WalletLayout>
    );
};

const Send = ({ children }: SendProps) => {
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const currentRoute = useSelector(selectRouteName);

    // alone selectedAccount.status is not enough, currently there is a race-condition that needs to be fixed in send form
    if (selectedAccount.status !== 'loaded' || currentRoute !== 'wallet-send') {
        return <WalletLayout title="TR_NAV_SEND" account={selectedAccount} />;
    }

    /* children are only for test purposes, this prop is not available in regular build */
    return <SendLoaded selectedAccount={selectedAccount}>{children}</SendLoaded>;
};

export default Send;
