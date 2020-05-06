/**
 * Component reflecting 'next/head' and working with 'react-navigation'
 * It should be mounted in some top level wrapper (Layout)
 * Sends requested params (title, drawerLockMode etc.) into current Navigator
 */

import { useEffect } from 'react';
import { withNavigation, NavigationInjectedProps } from 'react-navigation';
import { isChanged } from '@suite-utils/comparisonUtils';

type Props = NavigationInjectedProps & {
    title: string;
    enabled?: boolean; // enable/disable all Navigation (Drawer + Header + Tabs)
    disableTabs?: boolean; // enable/disable only Tabs (use case: "/wallet" without connected device vs. "/settings")
};

const Head = (props: Props) => {
    const { title, enabled, disableTabs, navigation } = props;
    const { setParams, getParam } = navigation;
    useEffect(() => {
        const isEnabled = !(enabled === false);
        const isTabEnabled = !disableTabs;
        const navigationOptions = {
            title,
            drawerLockMode: isEnabled ? 'unlocked' : 'locked-closed',
            header: isEnabled ? undefined : null, // `undefined` will render default header, `null` will render nothing
            tabBarVisible: isEnabled && isTabEnabled,
        };
        if (isChanged(getParam('navigationOptions'), navigationOptions)) {
            setParams({ navigationOptions });
        }
    }, [title, enabled, disableTabs, getParam, setParams]);
    return null;
};

export default withNavigation(Head);
