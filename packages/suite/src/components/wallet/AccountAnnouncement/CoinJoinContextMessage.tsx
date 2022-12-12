import React from 'react';
import { NotificationCard } from '@suite-components';
import { Link } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import { useMessageSystem, Context } from '@suite-hooks/useMessageSystem';
import { Account } from '@wallet-types';

type CoinJoinContextMessageProps = {
    account?: Account;
};

export const CoinJoinContextMessage = ({ account }: CoinJoinContextMessageProps) => {
    const { getContextMessage } = useMessageSystem();
    const language = useSelector(state => state.suite.settings.language) || 'en';
    const message = getContextMessage(Context.coinjoin);

    return account?.accountType === 'coinjoin' && message ? (
        <NotificationCard
            button={
                message.cta
                    ? {
                          children: (
                              <Link href={message.cta.link}>{message.cta.label[language]}</Link>
                          ),
                      }
                    : undefined
            }
            variant={message.variant === 'critical' ? 'error' : message.variant}
        >
            {message.content[language]}
        </NotificationCard>
    ) : null;
};
