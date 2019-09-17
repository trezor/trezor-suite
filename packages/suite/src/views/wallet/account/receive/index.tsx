import React from 'react';

import LayoutAccount from '@wallet-components/LayoutAccount';

import { AppState, Dispatch } from '@suite/types/suite';
import { connect } from 'react-redux';
import Content from '@suite/components/wallet/Content';
import * as receiveActions from '@wallet-actions/receiveActions';
import { bindActionCreators } from 'redux';
import { FormattedMessage } from 'react-intl';
import ReceiveForm from '@wallet-components/ReceiveForm';
import l10nMessages from '@wallet-components/ReceiveForm/messages';

interface Props {
    selectedAccount: AppState['wallet']['selectedAccount'];
    device: AppState['suite']['device'];
    modal: AppState['modal'];
    receive: AppState['wallet']['receive'];
    showAddress: typeof showAddress;
}

const getTitleForNetwork = (symbol: string) => {
    switch (symbol.toUpperCase()) {
        case 'BTC':
            return <FormattedMessage {...l10nMessages.TR_NETWORK_BITCOIN} />;
        case 'BCH':
            return <FormattedMessage {...l10nMessages.TR_NETWORK_BITCOIN_CASH} />;
        case 'BTG':
            return <FormattedMessage {...l10nMessages.TR_NETWORK_BITCOIN_GOLD} />;
        case 'DASH':
            return <FormattedMessage {...l10nMessages.TR_NETWORK_DASH} />;
        case 'DGB':
            return <FormattedMessage {...l10nMessages.TR_NETWORK_DIGIBYTE} />;
        case 'DOGE':
            return <FormattedMessage {...l10nMessages.TR_NETWORK_DOGECOIN} />;
        case 'LTC':
            return <FormattedMessage {...l10nMessages.TR_NETWORK_LITECOIN} />;
        case 'NMC':
            return <FormattedMessage {...l10nMessages.TR_NETWORK_NAMECOIN} />;
        case 'VTC':
            return <FormattedMessage {...l10nMessages.TR_NETWORK_VERTCOIN} />;
        case 'ZEC':
            return <FormattedMessage {...l10nMessages.TR_NETWORK_ZCASH} />;
        case 'ETH':
            return <FormattedMessage {...l10nMessages.TR_NETWORK_ETHEREUM_OR_TOKENS} />;
        case 'ETC':
            return <FormattedMessage {...l10nMessages.TR_NETWORK_ETHEREUM_OR_TOKENS} />;
        case 'NEM':
            return <FormattedMessage {...l10nMessages.TR_NETWORK_NEM} />;
        case 'XLM':
            return <FormattedMessage {...l10nMessages.TR_NETWORK_STELLAR} />;
        case 'ADA':
            return <FormattedMessage {...l10nMessages.TR_NETWORK_CARDANO} />;
        case 'XTZ':
            return <FormattedMessage {...l10nMessages.TR_NETWORK_TEZOS} />;
        default:
            break;
    }
};

const AccountReceive = (props: Props) => {
    const { device } = props;
    const { account, network, discovery, shouldRender } = props.selectedAccount;

    if (!device || !account || !discovery || !network || !shouldRender) {
        const { loader, exceptionPage } = props.selectedAccount;
        return (
            <LayoutAccount>
                <Content loader={loader} exceptionPage={exceptionPage} isLoading />
            </LayoutAccount>
        );
    }

    const isAddressPartiallyHidden = (descriptor: string) => {
        const receiveInfo = props.receive.addresses.find(r => r.descriptor === descriptor);
        if (receiveInfo) {
            return (
                !receiveInfo.isAddressVerifying &&
                !receiveInfo.isAddressVerified &&
                !receiveInfo.isAddressUnverified &&
                !account.imported
            );
        }
        return true;
    };

    const getAddressReceiveInfo = (descriptor: string) => {
        const receiveInfo = props.receive.addresses.find(r => r.descriptor === descriptor);
        if (receiveInfo) {
            return receiveInfo;
        }
        return null;
    };

    return (
        <LayoutAccount>
            <ReceiveForm
                account={account}
                device={device}
                showAddress={props.showAddress}
                isAddressPartiallyHidden={isAddressPartiallyHidden}
                getAddressReceiveInfo={getAddressReceiveInfo}
                networkType={network.networkType}
                title={
                    <FormattedMessage
                        {...l10nMessages.TR_RECEIVE_NETWORK}
                        values={{
                            network: getTitleForNetwork(account.symbol),
                        }}
                    />
                }
            />
        </LayoutAccount>
    );
};

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    device: state.suite.device,
    receive: state.wallet.receive,
    modal: state.modal,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    showAddress: bindActionCreators(receiveActions.showAddress, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(AccountReceive);
