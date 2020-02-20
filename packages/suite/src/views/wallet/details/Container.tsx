import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as modalActions from '@suite-actions/modalActions';

import { AppState, Dispatch } from '@suite-types';
import DetailsIndex from './index';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    device: state.suite.device,
    locks: state.suite.locks,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    openModal: bindActionCreators(modalActions.openModal, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(DetailsIndex);
