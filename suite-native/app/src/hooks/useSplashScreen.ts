import SplashScreen from 'react-native-splash-screen';
import { useEffect } from 'react';

export const useSplashScreen = (): void => {
    useEffect(() => {
        const splashTimerId = setTimeout(() => {
            SplashScreen.hide();
        }, 300);

        return () => clearTimeout(splashTimerId);
    }, []);
};
