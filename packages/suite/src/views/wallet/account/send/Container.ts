import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl } from 'react-intl';
import * as sendFormActions from '@wallet-actions/sendFormActions';

import * as sendFormActionsBitcoin from '@wallet-actions/sendFormSpecific/BitcoinActions';
import * as sendFormActionsEthereum from '@wallet-actions/sendFormSpecific/ethereumActions';
import * as sendFormActionsRipple from '@wallet-actions/sendFormSpecific/rippleActions';

import { AppState, Dispatch } from '@suite-types';
import SendIndex from './index';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    send: state.wallet.send,
    fiat: state.wallet.fiat,
    fees: state.wallet.fees,
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    sendFormActions: bindActionCreators(sendFormActions, dispatch),
    sendFormActionsBitcoin: bindActionCreators(sendFormActionsBitcoin, dispatch),
    sendFormActionsRipple: bindActionCreators(sendFormActionsRipple, dispatch),
    sendFormActionsEthereum: bindActionCreators(sendFormActionsEthereum, dispatch),
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps;

export default injectIntl(
    connect(
        mapStateToProps,
        mapDispatchToProps,
    )(SendIndex),
);
