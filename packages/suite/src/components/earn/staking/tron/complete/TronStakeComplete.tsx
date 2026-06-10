import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { Button, Column, IconCircle, Text } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

interface TronStakeCompleteProps {
    heading: ReactNode;
    description: ReactNode;
    children: ReactNode;
}

export const TronStakeComplete = ({ heading, description, children }: TronStakeCompleteProps) => {
    const dispatch = useDispatch();
    const { isBelowMobile } = useLayoutSize();

    const handleBackToOverview = () => dispatch(goto({ routeName: 'suite-earn' }));

    return (
        <Column gap={16}>
            <IconCircle name="check" intent="brand" size={isBelowMobile ? 64 : 96} />

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
