import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { AppState, Dispatch } from '@suite-types';

import DebugSettings from './index';
import { setDebugMode } from '@suite-actions/suiteActions';

const mapStateToProps = (state: AppState) => ({
    debug: state.suite.settings.debug,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            setDebugMode,
        },
        dispatch,
    );

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(DebugSettings);
