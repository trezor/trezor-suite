import React from 'react';
import { NotificationCard } from '@suite-components';
import { Link } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import { Context, selectContextMessageContent } from '@suite-reducers/messageSystemReducer';
import { Account } from '@wallet-types';

type CoinjoinContextMessageProps = {
    account?: Account;
};

export const CoinjoinContextMessage = ({ account }: CoinjoinContextMessageProps) => {
    const message = useSelector(state => selectContextMessageContent(state, Context.coinjoin));

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
            variant={message.variant}
        >
            {message.content}
        </NotificationCard>
    ) : null;
};
