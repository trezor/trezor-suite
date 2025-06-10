import { useSelector } from 'react-redux';

import {
    Context,
    MessageSystemRootState,
    selectContextMessage,
} from '@suite-common/message-system';
import { InlineAlertBox, InlineAlertBoxProps, Text } from '@suite-native/atoms';
import { Link } from '@suite-native/link';

import { useHandleMessageLink } from '../hooks/useHandleMessageLink';

export type ContextMessageProps = Omit<
    InlineAlertBoxProps,
    'variant' | 'title' | 'buttonLabel' | 'onButtonPress'
> & {
    context: (typeof Context)[keyof typeof Context];
};

export const ContextMessage = ({ context, ...rest }: ContextMessageProps) => {
    // TODO: We use only English locale in suite-native so far. When the localization to other
    const language = 'en';
    // languages is implemented, the language selection logic has to be added here.
    const message = useSelector((state: MessageSystemRootState) =>
        selectContextMessage(state, context),
    );

    const { linkLabel } = useHandleMessageLink({
        messageCTA: message?.cta,
        language,
    });

    if (!message) return null;

    const msgText = message.content[language];
    const link = message?.cta?.link;
    const shouldDisplayLink = !!(link && linkLabel);

    return (
        <InlineAlertBox
            variant={message.variant}
            title={
                <Text variant="label">
                    {msgText}
                    {msgText && shouldDisplayLink && ' '}
                    {shouldDisplayLink && (
                        <Link
                            label={linkLabel}
                            textVariant="label"
                            href={link}
                            isUnderlined
                            textColor="textDefault"
                            textPressedColor="textSubdued"
                        />
                    )}
                </Text>
            }
            {...rest}
        />
    );
};
