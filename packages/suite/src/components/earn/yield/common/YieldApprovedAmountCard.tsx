import { Translation } from '@suite/intl';
import { getCoingeckoId } from '@suite-common/wallet-config';
import type { YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { Card, IconButton, Row, Text } from '@trezor/components';
import { AssetLogo, CoinLogo } from '@trezor/product-components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

type YieldApprovedAmountCardProps = {
    token: YieldFlowDisplayToken;
    amount: string;
    onRevoke?: () => void;
};

export const YieldApprovedAmountCard = ({
    token,
    amount,
    onRevoke,
}: YieldApprovedAmountCardProps) => {
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
                <Text typographyStyle="body-md">
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
                    <FormattedCryptoAmount value={amount} symbol={token.symbol} />
                    {onRevoke && (
                        <IconButton
                            icon="x"
                            size="small"
                            intent="neutral"
                            priority="secondary"
                            onClick={onRevoke}
                        />
                    )}
                </Row>
            </Row>
        </Card>
    );
};
