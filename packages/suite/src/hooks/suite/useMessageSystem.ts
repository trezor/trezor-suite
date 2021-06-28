import { useMemo } from 'react';
import { useSelector } from './useSelector';

export const useMessageSystem = () => {
    const { config, validMessages, dismissedMessages } = useSelector(state => state.messageSystem);
    const banner = useMemo(() => {
        const nonDismissedValidMessages = validMessages.banner.filter(
            id => !dismissedMessages[id]?.banner,
        );

        const messages = config?.actions
            .filter(({ message }) => nonDismissedValidMessages.includes(message.id))
            .map(action => action.message);

        if (!messages?.length) return null;

        return messages.reduce((prev, current) =>
            prev.priority > current.priority ? prev : current,
        );
    }, [config, validMessages, dismissedMessages]);

    // TODO: context messages and modal messages

    return {
        banner,
    };
};
