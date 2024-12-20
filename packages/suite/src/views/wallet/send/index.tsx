import { ReactNode } from 'react';
import { useWatch } from 'react-hook-form';

import { Banner, Column, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { WalletLayout } from 'src/components/wallet';
import {
    useSendForm,
    SendContext,
    UseSendFormProps,
    useSendFormContext,
} from 'src/hooks/wallet/useSendForm';
import {
    selectTargetAnonymityByAccountKey,
    selectRegisteredUtxosByAccountKey,
} from 'src/reducers/wallet/coinjoinReducer';
import { Translation } from 'src/components/suite';
import { ConfirmEvmExplanationModal } from 'src/components/suite/modals';

import { SendHeader } from './SendHeader';
import { Outputs } from './Outputs/Outputs';
import { Options } from './Options/Options';
import { SendFees } from './SendFees';
import { TotalSent } from './TotalSent/TotalSent';
import { SendRaw } from './SendRaw';
import { CoinControl } from './Options/BitcoinOptions/CoinControl/CoinControl';

const UtxoPanel = () => {
    const { toggleOption, setDraftSaveRequest, setValue, getDefaultValue, control } =
        useSendFormContext();

    const toggleUtxoSelection = () => {
        setValue('hasCoinControlBeenOpened', true); // required for analytics
        toggleOption('utxoSelection');

        // This will trigger the effect in `useSendForm` and do `saveSendFormDraftThunk`.
        // This is not nice, but it will endure the new state is persisted in the Redux Store.
        // Without this, this change may be lost which will result in UI glitch (closing the Coin Control UI)
        setDraftSaveRequest(true);
    };

    const options = useWatch({
        name: 'options',
        defaultValue: getDefaultValue('options', []),
        control,
    });

    const utxoSelectionEnabled = options.includes('utxoSelection');

    return utxoSelectionEnabled && <CoinControl close={toggleUtxoSelection} />;
};

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
                <Row>
                    <Column gap={spacings.xl} alignItems="start">
                        <Column gap={spacings.xl}>
                            <SendHeader />

                            <Outputs disableAnim={!!children} />
                            <Options />
                            <SendFees />

                            {symbol === 'dsol' && (
                                <Banner icon>
                                    <Translation id="TR_SOLANA_DEVNET_SHORTCUT_WARNING" />
                                </Banner>
                            )}
                        </Column>
                        <TotalSent />
                    </Column>

                    <UtxoPanel />
                </Row>

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
