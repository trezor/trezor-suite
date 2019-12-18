import React, { useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Router, Scene, Stack, Actions } from 'react-native-router-flux';
import { View, Text, Button } from 'react-native';
import Index from '@suite-views';
import Wallet from '@wallet-views';
import DeviceSettings from '@suite-views/settings';

import * as routerActions from '@suite-actions/routerActions';
import { getRoute } from '@suite-utils/router';
import { Dispatch } from '@suite-types';

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
        console.log('back');
        // TODO: handle back button
        return true;
    };

    return (
        <View style={{ flex: 1 }}>
            <Router onStateChange={onRouteChanged} backAndroidHandler={onBack}>
                <Stack key="root">
                    <Scene
                        title="Initial view"
                        key={getRoute('suite-index')}
                        drawer
                        component={Index}
                        initial
                        // type="replace"
                    />
                    <Scene
                        title="Wallet"
                        key={getRoute('wallet-index')}
                        drawer
                        component={Wallet}
                    />
                    <Scene
                        title="Device settings"
                        key={getRoute('settings-index')}
                        drawer
                        component={DeviceSettings}
                    />
                </Stack>
            </Router>
        </View>
    );
};

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            onLocationChange: routerActions.onLocationChange,
        },
        dispatch,
    );

type Props = ReturnType<typeof mapDispatchToProps>;

export default connect(null, mapDispatchToProps)(RouterHandler);
