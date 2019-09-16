import React from 'react';
import LayoutAccount from '@wallet-components/LayoutAccount';
import { AppState, Dispatch } from '@suite/types/suite';
import { connect } from 'react-redux';
import Content from '@wallet-components/Content';
import { CONTEXT_DEVICE } from '@suite-actions/constants/modalConstants';
import { showAddress } from '@wallet-actions/receiveActions';
import { bindActionCreators } from 'redux';
import { FormattedMessage, injectIntl, InjectedIntl } from 'react-intl';
import { getTitleForNetwork } from '@wallet-utils/accountUtils';
import ReceiveForm from '@wallet-components/ReceiveForm';
import l10nMessages from '@wallet-components/ReceiveForm/messages';

interface Props {
    selectedAccount: AppState['wallet']['selectedAccount'];
    device: AppState['suite']['device'];
    modal: AppState['modal'];
    receive: AppState['wallet']['receive'];
    showAddress: typeof showAddress;
    intl: InjectedIntl;
}

const AccountReceive = (props: Props) => {
    const { device, intl } = props;
    const { account, network, discovery, shouldRender } = props.selectedAccount;

    if (!device || !account || !discovery || !network || !shouldRender) {
        const { loader, exceptionPage } = props.selectedAccount;
        return (
            <LayoutAccount>
                <Content loader={loader} exceptionPage={exceptionPage} isLoading />
            </LayoutAccount>
        );
    }

    // this logic below for figuring out if address is currently being verified (showing prompt on the device),
    // is based on the currently set modal dialog,
    // imo it should be implemented somewhere inside reducers (setting isVerifying prop inside the reducer)
    const isAddressVerifying =
        props.modal.context === CONTEXT_DEVICE &&
        props.modal.windowType === 'ButtonRequest_Address';

    const isAddressPartiallyHidden = (descriptor: string) => {
        const receiveInfo = props.receive.addresses.find(r => r.descriptor === descriptor);
        if (receiveInfo) {
            return (
                !isAddressVerifying &&
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
                isAddressVerifying={isAddressVerifying}
                networkType={network.networkType}
                title={
                    <FormattedMessage
                        {...l10nMessages.TR_RECEIVE_NETWORK}
                        values={{
                            network: getTitleForNetwork(account.symbol, intl),
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
    showAddress: bindActionCreators(showAddress, dispatch),
});

export default injectIntl(
    connect(
        mapStateToProps,
        mapDispatchToProps,
    )(AccountReceive),
);
