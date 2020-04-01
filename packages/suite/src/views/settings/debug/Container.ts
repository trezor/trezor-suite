import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { AppState, Dispatch } from '@suite-types';

import DebugSettings from './index';
import { setDebugMode } from '@suite-actions/suiteActions';

const mapStateToProps = (state: AppState) => ({
    debug: state.suite.settings.debug,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    setDebugMode: bindActionCreators(setDebugMode, dispatch),
});

export type Props = WrappedComponentProps &
    ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(DebugSettings));
