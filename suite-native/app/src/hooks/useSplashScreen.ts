import SplashScreen from 'react-native-splash-screen';
import { useEffect } from 'react';

export const useSplashScreen = (): void => {
    useEffect(() => {
        const splashTimerId = setTimeout(() => {
            SplashScreen.hide();
        }, 800);

        return () => clearTimeout(splashTimerId);
    }, []);
};
