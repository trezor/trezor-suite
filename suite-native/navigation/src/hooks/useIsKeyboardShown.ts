import { useEffect, useState } from 'react';
import { KeyboardEvents } from 'react-native-keyboard-controller';

export const useIsKeyboardShown = () => {
    const [isKeyboardShown, setIsKeyboardShown] = useState(false);

    useEffect(() => {
        const subscriptions = [
            KeyboardEvents.addListener('keyboardWillShow', () => setIsKeyboardShown(true)),
            // We need both keyboardWillHide and keyboardDidHide. If the keyboard is closed from
            // a bottom sheet, keyboardWillHide is not trigger on Android. And if we register only
            // keyboardDidHide, the closing animation glitches on both platforms.
            KeyboardEvents.addListener('keyboardWillHide', () => setIsKeyboardShown(false)),
            KeyboardEvents.addListener('keyboardDidHide', () => setIsKeyboardShown(false)),
        ];

        return () => {
            subscriptions.forEach(s => s.remove());
        };
    }, []);

    return isKeyboardShown;
};
