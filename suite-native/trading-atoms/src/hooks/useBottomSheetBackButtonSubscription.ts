import { useCallback } from 'react';
import { BackHandler } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

export const useBottomSheetBackButtonSubscription = (
    isSheetVisible: boolean,
    dismissSheet: () => void,
) => {
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (isSheetVisible) {
                    dismissSheet();
                }

                return isSheetVisible;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => subscription.remove();
        }, [isSheetVisible, dismissSheet]),
    );
};
