import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Dispatch, AppState } from '@suite-types';
import * as suiteActions from '@suite-actions/suiteActions';

import Component from './index';

// todo: probably not needed
const mapStateToProps = (state: AppState) => ({
    flags: state.suite.flags,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    setFlag: bindActionCreators(suiteActions.setFlag, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
