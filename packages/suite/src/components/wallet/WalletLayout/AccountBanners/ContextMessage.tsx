import { NotificationCard } from 'src/components/suite';
import { Link } from '@trezor/components';
import { useSelector } from 'src/hooks/suite';
import { selectContextMessageContent, Context } from '@suite-common/message-system';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import styled from 'styled-components';

type ContextMessageProps = {
    context: (typeof Context)[keyof typeof Context];
};

const StyledNotificationCard = styled(NotificationCard)`
    margin-bottom: 0;
`;

export const ContextMessage = ({ context }: ContextMessageProps) => {
    const language = useSelector(selectLanguage);
    const message = useSelector(state => selectContextMessageContent(state, context, language));

    return message ? (
        <StyledNotificationCard
            button={
                message.cta
                    ? {
                          children: (
                              <Link variant="nostyle" href={message.cta.link}>
                                  {message.cta.label}
                              </Link>
                          ),
                      }
                    : undefined
            }
            variant={message.variant === 'critical' ? 'destructive' : message.variant}
        >
            {message.content}
        </StyledNotificationCard>
    ) : null;
};
