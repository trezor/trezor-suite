import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { desktopApi } from '@trezor/suite-desktop-api';

import { open, setView } from 'src/actions/suite/guideActions';

// Opens the in-app guide on the right view when triggered from the desktop application
// menu (Help → Support & feedback / Keyboard shortcuts).
export const useGuideDesktopMenu = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!desktopApi.available) return;

        const openGuide = () => {
            dispatch(setView('GUIDE_DEFAULT'));
            dispatch(open());
        };

        const openSupportFeedback = () => {
            dispatch(setView('SUPPORT_FEEDBACK_SELECTION'));
            dispatch(open());
        };

        const openShortcuts = () => {
            dispatch(setView('KEYBOARD_SHORTCUTS'));
            dispatch(open());
        };

        desktopApi.on('guide/open', openGuide);
        desktopApi.on('guide/open-support-feedback', openSupportFeedback);
        desktopApi.on('guide/open-shortcuts', openShortcuts);

        return () => {
            desktopApi.removeAllListeners('guide/open');
            desktopApi.removeAllListeners('guide/open-support-feedback');
            desktopApi.removeAllListeners('guide/open-shortcuts');
        };
    }, [dispatch]);
};
