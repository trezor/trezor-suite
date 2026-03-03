import { Translation } from '@suite/intl';
import { Column, Text } from '@trezor/components';

import { useEarnRouteAccount } from 'src/components/earn/utils/useEarnRouteAccount';

export const YieldSupply = () => {
    const { account } = useEarnRouteAccount();

    if (!account) {
        return null;
    }

    return (
        <Column gap={24}>
            <Text typographyStyle="headline-md">
                <Translation id="TR_EARN_YIELD_SELECT_AMOUNT_AND_APPROVE" />
            </Text>
        </Column>
    );
};
