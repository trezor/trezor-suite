import React from 'react';

import LayoutAccount from '@wallet-components/LayoutAccount';

import { AppState, Dispatch } from '@suite/types/suite';
import { connect } from 'react-redux';
import Content from '@suite/components/wallet/Content';
import { CONTEXT_DEVICE } from '@suite-actions/constants/modalConstants';
import { showAddress } from '@wallet-actions/receiveActions';
import { bindActionCreators } from 'redux';
import EthereumTypeReceiveForm from './ethereum';
import RippleTypeReceiveForm from './ripple';
import BitcoinTypeReceiveForm from './bitcoin';

interface Props {
    selectedAccount: AppState['wallet']['selectedAccount'];
    device: AppState['suite']['device'];
    modal: AppState['modal'];
    receive: AppState['wallet']['receive'];
    showAddress: typeof showAddress;
}

export interface ReceiveProps {
    className?: string;
    // makes all props in selectedAccount required, so the account we need is not optional anymore
    // also excludes null;
    account: Exclude<Required<AppState['wallet']['selectedAccount']>['account'], null>;
    address: string;
    isAddressVerifying: boolean;
    isAddressUnverified: boolean;
    isAddressPartiallyHidden: boolean;
    isAddressVerified: boolean;
    showAddress: typeof showAddress;
    device: Exclude<AppState['suite']['device'], undefined>;
}

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

    const { isAddressVerified, isAddressUnverified } = props.receive;

    // this logic below for figuring out if address is currently being verified (showing prompt on the device),
    // is based on the currently set modal dialog,
    // imo it should be implemented somewhere inside reducers (setting isVerifying prop inside the reducer)
    const isAddressVerifying =
        props.modal.context === CONTEXT_DEVICE &&
        props.modal.windowType === 'ButtonRequest_Address';

    const isAddressPartiallyHidden =
        !isAddressVerifying && !isAddressVerified && !isAddressUnverified && !account.imported;

    let address = `${account.descriptor.substring(0, 20)}...`;
    if (isAddressVerified || isAddressUnverified || isAddressVerifying || account.imported) {
        address = account.descriptor;
    }

    const commonComponentProps = {
        account,
        device,
        address,
        showAddress: props.showAddress,
        isAddressPartiallyHidden,
        isAddressVerified,
        isAddressUnverified,
        isAddressVerifying,
    };

    return (
        <LayoutAccount>
            {network.type === 'bitcoin' && <BitcoinTypeReceiveForm {...commonComponentProps} />}
            {network.type === 'ethereum' && <EthereumTypeReceiveForm {...commonComponentProps} />}
            {network.type === 'ripple' && <RippleTypeReceiveForm {...commonComponentProps} />}
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

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(AccountReceive);
