import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as routerActions from '@suite-actions/routerActions';

import { Dispatch } from '@suite-types';

import Step from './index';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    closeModalApp: bindActionCreators(routerActions.back, dispatch),
});

export type Props = ReturnType<typeof mapDispatchToProps>;

export default connect(null, mapDispatchToProps)(Step);
