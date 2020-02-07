import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { WalletLayout } from '@wallet-components';
import * as receiveActions from '@wallet-actions/receiveActions';
import { SUITE } from '@suite-actions/constants';
import { AppState, Dispatch } from '@suite-types';
import Header from './components/Header';
import FreshAddress from './components/FreshAddress';
import UsedAddresses from './components/UsedAddresses';

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

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;
export interface ChildProps {
    account: NonNullable<Props['selectedAccount']['account']>;
    addresses: Props['receive'];
    showAddress: Props['showAddress'];
    disabled: boolean;
    locked: boolean;
}

const AccountReceive = (props: Props) => {
    const { device, locks, receive } = props;
    if (!device || props.selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Receive" account={props.selectedAccount} />;
    }
    const { account } = props.selectedAccount;
    const locked = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);
    const disabled = !!device.authConfirm;

    return (
        <WalletLayout title="Receive" account={props.selectedAccount}>
            <Header account={account} />
            <FreshAddress
                account={account}
                addresses={receive}
                showAddress={props.showAddress}
                disabled={disabled}
                locked={locked}
            />
            <UsedAddresses
                account={account}
                addresses={receive}
                showAddress={props.showAddress}
                disabled={disabled}
                locked={locked}
            />
        </WalletLayout>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(AccountReceive);
