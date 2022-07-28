import React, { useEffect } from 'react';
import SplashScreen from 'react-native-splash-screen';

export const useSplashScreen = (): void => {
    const [hideSplash, setHideSplash] = React.useState(false);

    useEffect(() => {
        const splashTimerId = setTimeout(() => {
            setHideSplash(true);
        }, 800);

        return () => clearTimeout(splashTimerId);
    }, []);

    useEffect(() => {
        if (hideSplash) {
            SplashScreen.hide();
        }
    }, [hideSplash]);
};
