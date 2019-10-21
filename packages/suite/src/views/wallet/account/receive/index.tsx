import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FormattedMessage, injectIntl, WrappedComponentProps } from 'react-intl';

import LayoutAccount from '@wallet-components/LayoutAccount';
import Content from '@wallet-components/Content';
import * as receiveActions from '@wallet-actions/receiveActions';
import { getTitleForNetwork } from '@wallet-utils/accountUtils';
import { SUITE } from '@suite-actions/constants';
import { AppState, Dispatch } from '@suite-types';
import ReceiveForm from './components/ReceiveForm';
import l10nMessages from './components/ReceiveForm/messages';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    device: state.suite.device,
    receive: state.wallet.receive,
    modal: state.modal,
    locks: state.suite.locks,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    showAddress: bindActionCreators(receiveActions.showAddress, dispatch),
});

type Props = WrappedComponentProps &
    ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

const AccountReceive = (props: Props) => {
    const { device, intl } = props;
    const { account, network, discovery, shouldRender } = props.selectedAccount;

    if (!device || !account || !discovery || !network || !shouldRender) {
        const { loader, exceptionPage } = props.selectedAccount;
        return (
            <LayoutAccount title="Receive">
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

    const showButtonDisabled =
        props.locks.includes(SUITE.LOCK_TYPE.DEVICE) || props.locks.includes(SUITE.LOCK_TYPE.UI);

    return (
        <LayoutAccount title="Receive">
            <ReceiveForm
                showButtonDisabled={showButtonDisabled}
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
                            network: getTitleForNetwork(account.symbol, intl),
                        }}
                    />
                }
            />
        </LayoutAccount>
    );
};

export default injectIntl(
    connect(
        mapStateToProps,
        mapDispatchToProps,
    )(AccountReceive),
);
