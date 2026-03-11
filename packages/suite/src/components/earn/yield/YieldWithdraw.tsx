import { Translation } from '@suite/intl';
import { Column, Text } from '@trezor/components';

import { useEarnRouteAccount } from 'src/components/earn/utils/useEarnRouteAccount';
import { useYieldAssetSymbol } from 'src/components/earn/yield/common/useYieldAssetSymbol';

export const YieldWithdraw = () => {
    const { account, routeParams } = useEarnRouteAccount();
    const tokenSymbol = useYieldAssetSymbol({
        account,
        contractAddress: routeParams?.contractAddress ?? undefined,
    });

    if (!account) {
        return null;
    }

    return (
        <Column gap={24}>
            <Text typographyStyle="headline-md">
                <Translation id="TR_EARN_YIELD_WITHDRAW_ASSET" values={{ symbol: tokenSymbol }} />
            </Text>
        </Column>
    );
};
