import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';
import { Button, Column, IconCircle, Text } from '@trezor/components';
import { CheckIcon } from '@trezor/icons';

import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

interface TronStakeCompleteProps {
    account: Account;
    heading: ReactNode;
    description: ReactNode;
    children: ReactNode;
}

export const TronStakeComplete = ({
    account,
    heading,
    description,
    children,
}: TronStakeCompleteProps) => {
    const dispatch = useDispatch();
    const { isBelowMobile } = useLayoutSize();

    const handleBackToOverview = () =>
        dispatch(
            goto({
                routeName: 'wallet-staking',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

    return (
        <Column gap={16}>
            <IconCircle icon={CheckIcon} intent="brand" size={isBelowMobile ? 64 : 96} />

            <Column gap={4}>
                <Text typographyStyle="headline-md">{heading}</Text>
                <Text intent="neutral" priority="secondary">
                    {description}
                </Text>
            </Column>

            {children}

            <Button intent="neutral" priority="secondary" onClick={handleBackToOverview}>
                <Translation id="TR_EARN_YIELD_BACK_TO_OVERVIEW" />
            </Button>
        </Column>
    );
};
