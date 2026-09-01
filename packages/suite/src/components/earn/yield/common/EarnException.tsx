import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { type IconCircleIntent, type IconComponent } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

import { AccountExceptionLayout } from 'src/components/wallet';

type EarnExceptionProps = {
    title: ReactNode;
    icon?: IconComponent;
    iconVariant?: IconCircleIntent;
};

export const EarnException = ({
    title,
    icon = WarningIcon,
    iconVariant = 'neutral',
}: EarnExceptionProps) => {
    const dispatch = useDispatch();

    return (
        <AccountExceptionLayout
            title={title}
            icon={icon}
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
