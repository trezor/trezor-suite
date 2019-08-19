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

export interface ReceiveProps {
    className?: string;
    account: AppState['wallet']['selectedAccount']['account'];
    address: string;
    isAddressVerifying: boolean;
    isAddressUnverified: boolean;
    isAddressHidden: boolean;
    isAddressVerified: boolean;
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

    const CONTEXT_DEVICE = ''; // fake, TODO: correct import
    const isAddressVerifying =
        // @ts-ignore TODO: add with modal
        props.modal.context === CONTEXT_DEVICE &&
        // @ts-ignore TODO: add with modal
        props.modal.windowType === 'ButtonRequest_Address';
    const isAddressHidden =
        !isAddressVerifying && !isAddressVerified && !isAddressUnverified && !account.imported;

    let address = `${account.descriptor.substring(0, 20)}...`;
    if (isAddressVerified || isAddressUnverified || isAddressVerifying || account.imported) {
        address = account.descriptor;
    }

    const componentProps = {
        account,
        device,
        address,
        showAddress: props.showAddress,
        isAddressHidden,
        isAddressVerified,
        isAddressUnverified,
        isAddressVerifying,
    };

    return (
        <LayoutAccount>
            {network.type === 'bitcoin' && <BitcoinTypeReceiveForm {...componentProps} />}
            {network.type === 'ethereum' && <EthereumTypeReceiveForm {...componentProps} />}
            {network.type === 'ripple' && <RippleTypeReceiveForm {...componentProps} />}
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
