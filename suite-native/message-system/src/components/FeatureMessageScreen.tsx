import { useDispatch } from 'react-redux';

import { A, G } from '@mobily/ts-belt';

import { Message } from '@suite-common/suite-types';
import { messageSystemActions } from '@suite-common/message-system';
import { useTranslate } from '@suite-native/intl';

import { MessageScreen } from './MessageScreen';

type FeatureMessageScreenProps = {
    message: Message;
};

export const FeatureMessageScreen = ({ message }: FeatureMessageScreenProps) => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();
    const { id: messageId, dismissible: isDismissable, category, feature } = message;

    const isKillswitch =
        feature && A.isNotEmpty(feature?.filter(item => item.domain === 'killswitch' && item.flag));

    const handleDismiss = () => {
        if (!isDismissable) return;

        const categories = G.isArray(category) ? category : [category];
        categories.forEach(item => {
            dispatch(
                messageSystemActions.dismissMessage({
                    id: messageId,
                    category: item,
                }),
            );
        });
    };

    return (
        <MessageScreen
            message={message}
            defaultTitle={isKillswitch ? translate('messages.killswitch.title') : undefined}
            defaultContent={isKillswitch ? translate('messages.killswitch.content') : undefined}
            secondaryButtonLabel={isDismissable ? translate('generic.buttons.dismiss') : undefined}
            onSecondaryButtonPress={() => handleDismiss}
        />
    );
};
