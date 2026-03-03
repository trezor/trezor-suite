import { Translation } from '@suite/intl';
import { selectTradingCoinSymbolByCryptoId, toTokenCryptoId } from '@suite-common/trading';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { Column, Text } from '@trezor/components';

import { useEarnRouteAccount } from 'src/components/earn/utils/useEarnRouteAccount';
import { useSelector } from 'src/hooks/suite';

export const YieldWithdraw = () => {
    const { account, routeParams } = useEarnRouteAccount();

    const normalizedContractAddress =
        account && routeParams?.contractAddress
            ? getContractAddressForNetworkSymbol(account.symbol, routeParams.contractAddress)
            : undefined;

    const tokenSymbolFromAccount = account?.tokens?.find(
        token =>
            normalizedContractAddress !== undefined &&
            token.contract !== undefined &&
            getContractAddressForNetworkSymbol(account.symbol, token.contract) ===
                normalizedContractAddress,
    )?.symbol;

    const tokenCryptoId =
        account && normalizedContractAddress
            ? toTokenCryptoId(account.symbol, normalizedContractAddress)
            : undefined;

    const tokenSymbolFromTrading = useSelector(state =>
        selectTradingCoinSymbolByCryptoId(state, tokenCryptoId),
    );

    if (!account) {
        return null;
    }

    const tokenSymbol =
        tokenSymbolFromAccount ?? tokenSymbolFromTrading ?? getNetworkDisplaySymbol(account.symbol);

    return (
        <Column gap={24}>
            <Text typographyStyle="headline-md">
                <Translation id="TR_EARN_YIELD_WITHDRAW_ASSET" values={{ symbol: tokenSymbol }} />
            </Text>
        </Column>
    );
};
