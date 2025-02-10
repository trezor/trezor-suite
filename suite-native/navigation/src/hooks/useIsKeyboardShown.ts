import { useEffect, useState } from 'react';
import { KeyboardEvents } from 'react-native-keyboard-controller';

export const useIsKeyboardShown = () => {
    const [isKeyboardShown, setIsKeyboardShown] = useState(false);

    useEffect(() => {
        const willShowSubscription = KeyboardEvents.addListener('keyboardWillShow', () =>
            setIsKeyboardShown(true),
        );
        const willHideSubscription = KeyboardEvents.addListener('keyboardWillHide', () =>
            setIsKeyboardShown(false),
        );

        return () => {
            willShowSubscription.remove();
            willHideSubscription.remove();
        };
    }, []);

    return isKeyboardShown;
};
