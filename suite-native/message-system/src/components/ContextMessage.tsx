import { useSelector } from 'react-redux';

import {
    type ContextDomain,
    type MessageSystemRootState,
    selectContextMessageContent,
} from '@suite-common/message-system';
import { InlineAlertBox, type InlineAlertBoxProps, Text } from '@suite-native/atoms';
import { selectLocale } from '@suite-native/intl';
import { Link } from '@suite-native/link';

export type ContextMessageProps = Omit<
    InlineAlertBoxProps,
    'variant' | 'title' | 'buttonLabel' | 'onButtonPress'
> & {
    context: ContextDomain;
};

export const ContextMessage = ({ context, ...rest }: ContextMessageProps) => {
    const locale = useSelector(selectLocale);
    const message = useSelector((state: MessageSystemRootState) =>
        selectContextMessageContent(state, context, locale),
    );

    if (!message) {
        return null;
    }

    const { content, variant, cta } = message;
    const { label, link } = cta ?? {};
    const shouldDisplayLink = !!(link && label);

    return (
        <InlineAlertBox
            variant={variant}
            title={
                <Text variant="body-xs">
                    {content}
                    {content && shouldDisplayLink && ' '}
                    {shouldDisplayLink && (
                        <Link
                            label={label}
                            textVariant="body-xs"
                            href={link}
                            isUnderlined
                            textColor="contentPrimary"
                            textPressedColor="contentSecondary"
                        />
                    )}
                </Text>
            }
            {...rest}
        />
    );
};
