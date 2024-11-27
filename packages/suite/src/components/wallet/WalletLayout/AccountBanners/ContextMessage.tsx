import { Banner } from '@trezor/components';
import { selectContextMessageContent, Context } from '@suite-common/message-system';

import { useSelector } from 'src/hooks/suite';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';

type ContextMessageProps = {
    context: (typeof Context)[keyof typeof Context];
};

export const ContextMessage = ({ context }: ContextMessageProps) => {
    const language = useSelector(selectLanguage);
    const message = useSelector(state => selectContextMessageContent(state, context, language));

    return message ? (
        <Banner
            variant={message.variant === 'critical' ? 'destructive' : message.variant}
            rightContent={
                message.cta ? (
                    <Banner.Button href={message.cta.link}>{message.cta.label}</Banner.Button>
                ) : undefined
            }
        >
            {message.content}
        </Banner>
    ) : null;
};
