/**
 * Component reflecting 'next/head' and working with 'react-navigation'
 * It should be mounted in some top level wrapper (Layout)
 * Sends requested params (title, drawerLockMode etc.) into current Navigator
 */

import { useEffect } from 'react';
import { withNavigation, NavigationInjectedProps } from 'react-navigation';

type Props = NavigationInjectedProps & {
    title: string;
    enabled?: boolean; // enable/disable all Navigation (Drawer + Header + Tabs)
    // disableDrawer?: boolean; // enable/disable only Drawer,Header
    disableTabs?: boolean; // enable/disable only Tabs (use case: "/wallet" without connected device vs. "/settings")
};

// TODO:
// - do not set if already exists (use case: back button)

const Head = (props: Props) => {
    const { title, enabled, disableTabs, navigation } = props;
    const { setParams } = navigation;
    useEffect(() => {
        const isEnabled = !(enabled === false);
        const isTabEnabled = true; // TODO: !disableTabs;
        setParams({
            navigationOptions: {
                title,
                drawerLockMode: isEnabled ? 'unlocked' : 'locked-closed',
                header: isEnabled ? undefined : null, // `undefined` will render default header, `null` will render nothing
                tabBarVisible: isEnabled && isTabEnabled,
            },
        });
    }, [title, enabled, disableTabs, setParams]); // eslint-disable-line react-hooks/exhaustive-deps
    return null;
};

export default withNavigation(Head);
