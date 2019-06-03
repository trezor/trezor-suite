import React, { useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Router, Scene, Actions } from 'react-native-router-flux';
import Index from '@suite/views';
import Wallet from '@suite/views/wallet';
import WalletSend from '@suite/views/wallet/account/send';
import { onLocationChange } from '@suite/actions/routerActions';
import { Dispatch } from '@suite/types';

// sources:
// https://blog.usejournal.com/react-native-and-redux-part-5-3185f8f0609b
// https://github.com/anuj070894/react_native_medium_4/blob/master/src/Router.js

// lazy loading explanation:
// https://stackoverflow.com/questions/55175943/how-to-do-lazy-loading-in-react-native-with-router-flux-for-better-performance

// /* <Scene key="launch" component={Launch} title="Launch" initial type={ActionConst.RESET} /> */

const RouterHandler = ({ onLocationChange }: Props) => {
    useEffect(() => {
        // set initial location
        onLocationChange(Actions.currentScene);
    }, [onLocationChange]);

    const onRouteChanged = (_prevState: any, _newState: any, action: any) => {
        const { params, routeName } = action;
        if (routeName) {
            const pathname = params && params.hash ? `${routeName}#${params.hash}` : routeName;
            onLocationChange(pathname);
        }
    };

    const onBack = () => {
        // TODO: handle back button
        return true;
    };

    return (
        <Router onStateChange={onRouteChanged} backAndroidHandler={onBack}>
            <Scene key="root">
                <Scene key="/" drawer component={Index} initial type="replace" />
                <Scene key="/wallet" drawer component={Wallet} type="replace" />
                <Scene
                    key="/wallet/send"
                    drawer
                    component={WalletSend}
                    type="replace" /* type={ActionConst.REPLACE} */
                />
            </Scene>
        </Router>
    );
};

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            onLocationChange,
        },
        dispatch,
    );

type Props = ReturnType<typeof mapDispatchToProps>;

export default connect(
    null,
    mapDispatchToProps,
)(RouterHandler);
