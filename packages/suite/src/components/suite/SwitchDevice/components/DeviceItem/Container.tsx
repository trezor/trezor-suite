import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import {
    AppState,
    Dispatch,
    TrezorDevice,
    AcquiredDevice,
    InjectedModalApplicationProps,
} from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    router: state.router,
    selectedDevice: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            goto: routerActions.goto,
            getBackgroundRoute: routerActions.getBackgroundRoute,
            selectDevice: suiteActions.selectDevice,
            acquireDevice: suiteActions.acquireDevice,
            createDeviceInstance: suiteActions.createDeviceInstance,
        },
        dispatch,
    );

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> & {
        device: TrezorDevice;
        instances: AcquiredDevice[];
        closeModalApp: InjectedModalApplicationProps['closeModalApp'];
        backgroundRoute: ReturnType<InjectedModalApplicationProps['getBackgroundRoute']>;
    };

export default connect(mapStateToProps, mapDispatchToProps)(Component);
