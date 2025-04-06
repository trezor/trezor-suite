import { AccessibilityProps } from 'react-native';
import { useSelector } from 'react-redux';

import {
    Context,
    MessageSystemRootState,
    selectContextMessage,
} from '@suite-common/message-system';
import { InlineAlertBox } from '@suite-native/atoms';

import { useHandleMessageLink } from '../hooks/useHandleMessageLink';

type ContextMessageProps = AccessibilityProps & {
    context: (typeof Context)[keyof typeof Context];
};

export const ContextMessage = ({ context, ...rest }: ContextMessageProps) => {
    // TODO: We use only English locale in suite-native so far. When the localization to other
    const language = 'en';
    // languages is implemented, the language selection logic has to be added here.
    const message = useSelector((state: MessageSystemRootState) =>
        selectContextMessage(state, context),
    );

    const { linkLabel, handleLinkPress } = useHandleMessageLink({
        messageCTA: message?.cta,
        language,
    });

    if (!message) return null;

    return (
        <InlineAlertBox
            variant={message.variant}
            title={message.content[language]}
            buttonLabel={linkLabel}
            onButtonPress={handleLinkPress}
            {...rest}
        />
    );
};
