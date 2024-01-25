import { NotificationCard } from 'src/components/suite';
import { Link } from '@trezor/components';
import { useSelector } from 'src/hooks/suite';
import { selectContextMessageContent, Context } from '@suite-common/message-system';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import { Account } from 'src/types/wallet';

type CoinjoinContextMessageProps = {
    account?: Account;
};

export const CoinjoinContextMessage = ({ account }: CoinjoinContextMessageProps) => {
    const language = useSelector(selectLanguage);
    const message = useSelector(state =>
        selectContextMessageContent(state, Context.coinjoin, language),
    );

    return account?.accountType === 'coinjoin' && message ? (
        <NotificationCard
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
        </NotificationCard>
    ) : null;
};
