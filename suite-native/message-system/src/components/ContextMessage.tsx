import { AccessibilityProps } from 'react-native';
import { useSelector } from 'react-redux';

import {
    Context,
    MessageSystemRootState,
    selectContextMessage,
} from '@suite-common/message-system';
import { Message } from '@suite-common/suite-types';
import { AlertBox, AlertBoxVariant } from '@suite-native/atoms';

import { MessageLink } from './MessageLink';

type ContextMessageProps = AccessibilityProps & {
    context: (typeof Context)[keyof typeof Context];
};

const getAlertBoxVariantForMessage = (message: Message): AlertBoxVariant => {
    if (message.variant === 'critical') {
        return 'error';
    }

    return message.variant;
};

export const ContextMessage = ({ context, ...rest }: ContextMessageProps) => {
    // TODO: We use only English locale in suite-native so far. When the localization to other
    // languages is implemented, the language selection logic has to be added here.
    const language = 'en';
    const message = useSelector((state: MessageSystemRootState) =>
        selectContextMessage(state, context),
    );

    if (!message) return null;

    return (
        <AlertBox
            variant={getAlertBoxVariantForMessage(message)}
            textVariant="hint"
            title={message.content[language]}
            rightButton={
                message.cta && (
                    <MessageLink messageCTA={message.cta} language={language} textVariant="hint" />
                )
            }
            {...rest}
        />
    );
};
