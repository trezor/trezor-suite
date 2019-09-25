import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as suiteActions from '@suite-actions/suiteActions';

import { Dispatch } from '@suite-types';

import Step from './index';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    exitApp: bindActionCreators(suiteActions.exitApp, dispatch),
});

export type Props = ReturnType<typeof mapDispatchToProps>;

export default connect(
    null,
    mapDispatchToProps,
)(Step);
