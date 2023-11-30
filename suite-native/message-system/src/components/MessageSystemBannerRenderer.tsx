import { VStack } from '@suite-native/atoms';

import { MessageBanner } from './MessageBanner';

export const MessageSystemBannerRenderer = () => {
    const activeBannerMessages = useSelector(selectActiveBannerMessages);

    return (
        <VStack spacing={4}>
            {activeBannerMessages.map(message => (
                <MessageBanner key={message.id} message={message} />
            ))}
        </VStack>
    );
};
