import { connect } from 'react-redux';
import { AppState, Dispatch } from '@suite-types';
import * as supportedIconsActions from '@wallet-actions/supportedIconsActions';
import { bindActionCreators } from 'redux';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    supportedIcons: state.wallet.supportedIcons,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    supportedIconsActions: bindActionCreators(supportedIconsActions, dispatch),
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
