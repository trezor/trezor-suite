import React from 'react';

import LayoutAccount from '@wallet-components/LayoutAccount';

import { AppState, Dispatch } from '@suite/types/suite';
import { connect } from 'react-redux';
import Content from '@suite/components/wallet/Content';
import { showAddress } from '@suite/actions/wallet/receiveActions';
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

const AccountReceive = (props: Props) => {
    const { device } = props;
    const { account, network, discovery, shouldRender } = props.selectedAccount;

    if (!device || !account || !discovery || !network || !shouldRender) {
        const { loader, exceptionPage } = props.selectedAccount;
        return <Content loader={loader} exceptionPage={exceptionPage} isLoading />;
    }

    const { isAddressVerified, isAddressUnverified } = props.receive;

    const CONTEXT_DEVICE = ''; // fake, TODO: correct import
    const isAddressVerifying =
        props.modal.context === CONTEXT_DEVICE &&
        props.modal.windowType === 'ButtonRequest_Address';
    const isAddressHidden =
        !isAddressVerifying && !isAddressVerified && !isAddressUnverified && !account.imported;

    let address = `${account.descriptor.substring(0, 20)}...`;
    if (isAddressVerified || isAddressUnverified || isAddressVerifying || account.imported) {
        address = account.descriptor;
    }

    return (
        <LayoutAccount>
            {network.type === 'bitcoin' && <BitcoinTypeReceiveForm {...props} />}
            {network.type === 'ethereum' && (
                <EthereumTypeReceiveForm
                    account={account}
                    device={device}
                    address={address}
                    showAddress={props.showAddress}
                    isAddressHidden={isAddressHidden}
                    isAddressVerified={isAddressVerified}
                    isAddressUnverified={isAddressUnverified}
                    isAddressVerifying={isAddressVerifying}
                />
            )}
            {network.type === 'ripple' && <RippleTypeReceiveForm {...props} />}
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
