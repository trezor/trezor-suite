import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { type IconCircleIntent, type IconName } from '@trezor/components';

import { AccountExceptionLayout } from 'src/components/wallet';
import { useDispatch } from 'src/hooks/suite';

type EarnExceptionProps = {
    title: ReactNode;
    iconName?: IconName;
    iconVariant?: IconCircleIntent;
};

export const EarnException = ({
    title,
    iconName = 'warning',
    iconVariant = 'neutral',
}: EarnExceptionProps) => {
    const dispatch = useDispatch();

    return (
        <AccountExceptionLayout
            title={title}
            iconName={iconName}
            iconVariant={iconVariant}
            actions={[
                {
                    key: 'back-to-earn-dashboard',
                    intent: 'neutral',
                    priority: 'secondary',
                    onClick: () => dispatch(goto({ routeName: 'suite-earn' })),
                    children: <Translation id="TR_EARN_YIELD_BACK_TO_OVERVIEW" />,
                },
            ]}
        />
    );
};
