import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as resizeActions from '@suite-actions/resizeActions';

import { Dispatch } from '@suite-types';
import Component from './index';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    updateWindowSize: bindActionCreators(resizeActions.updateWindowSize, dispatch),
});

export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = DispatchProps;

export default connect(null, mapDispatchToProps)(Component);
