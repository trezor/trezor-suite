import { Translation } from '@suite/intl';
import { getCoingeckoId } from '@suite-common/wallet-config';
import { Card, Row, Text } from '@trezor/components';
import { AssetLogo, CoinLogo } from '@trezor/product-components';

import type { YieldFlowDisplayToken } from './types';

type YieldApprovedAmountCardProps = {
    token: YieldFlowDisplayToken;
    amount: string;
};

export const YieldApprovedAmountCard = ({ token, amount }: YieldApprovedAmountCardProps) => {
    const assetLogo =
        token.contractAddress || token.coingeckoId
            ? {
                  coingeckoId: getCoingeckoId(token.networkSymbol) ?? token.coingeckoId,
                  placeholder: token.symbol,
                  contractAddress: token.contractAddress ?? null,
              }
            : undefined;

    return (
        <Card fillType="flat" paddingType="small">
            <Row justifyContent="space-between" alignItems="center" width="100%">
                <Text typographyStyle="body-sm">
                    <Translation id="TR_EARN_YIELD_APPROVED_AMOUNT" />
                </Text>
                <Row alignItems="center" gap={8}>
                    {assetLogo?.coingeckoId ? (
                        <AssetLogo
                            size={20}
                            coingeckoId={assetLogo.coingeckoId}
                            placeholder={assetLogo.placeholder}
                            symbol={token.networkSymbol}
                            contractAddress={assetLogo.contractAddress}
                            showNetworkIcon
                        />
                    ) : (
                        <CoinLogo size={20} symbol={token.networkSymbol} type="tokenWithNetwork" />
                    )}
                    <Text typographyStyle="body-sm-strong">{`${amount} ${token.symbol}`}</Text>
                </Row>
            </Row>
        </Card>
    );
};
