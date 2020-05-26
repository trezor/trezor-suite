import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as routerActions from '@suite-actions/routerActions';

import { AppState, Dispatch } from '@suite-types';
import Index from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    notifications: state.notifications,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            dispatch,
            goto: routerActions.goto,
        },
        dispatch,
    );

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Index);
