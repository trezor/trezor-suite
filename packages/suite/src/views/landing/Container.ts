import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Dispatch } from '@suite-types';
import * as suiteActions from '@suite-actions/suiteActions';

import Component from './index';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    setFlag: bindActionCreators(suiteActions.setFlag, dispatch),
});

export type Props = ReturnType<typeof mapDispatchToProps>;

export default connect(null, mapDispatchToProps)(Component);
