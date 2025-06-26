import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

export const useOverrideBackNavigation = ({ onNavigateBack }: { onNavigateBack?: () => void }) => {
    const navigation = useNavigation();

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', e => {
            if (e.data.action.type === 'GO_BACK') {
                e.preventDefault();
                onNavigateBack?.();
            }
        });

        return unsubscribe;
    }, [onNavigateBack, navigation]);
};
