import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { recoverDevice, checkSeed } from '@recovery-actions/recoveryActions';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { Dispatch, AppState } from '@suite-types';
import View from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    locks: state.suite.locks,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    recoverDevice: bindActionCreators(recoverDevice, dispatch),
    checkSeed: bindActionCreators(checkSeed, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    WrappedComponentProps;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(View));
