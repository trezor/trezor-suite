import { type TokenDto } from '@suite-common/earn-api';
import { type NetworkSymbol, getCoingeckoId } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Column, Row } from '@trezor/components';
import { AssetLogo, CoinLogo } from '@trezor/product-components';

import { EarnAccountCellDetails } from './EarnAccountCellDetails';
import { type EarnTokenBalance } from './types';

type EarnAccountCellProps = {
    account?: Account;
    symbol?: NetworkSymbol;
    iconToken?: TokenDto;
    showAssetNetworkIcon?: boolean;
    tokenBalance?: EarnTokenBalance;
    subtitle?: string;
};

export const EarnAccountCell = ({
    account,
    symbol,
    iconToken,
    showAssetNetworkIcon = false,
    tokenBalance,
    subtitle,
}: EarnAccountCellProps) => {
    const networkSymbol = account?.symbol ?? symbol;
    const assetLogo =
        iconToken && networkSymbol
            ? {
                  coingeckoId: getCoingeckoId(networkSymbol) ?? iconToken.coinGeckoId,
                  placeholder: iconToken.symbol || iconToken.name || 'token',
                  contractAddress: iconToken.address ?? null,
                  showNetworkIcon: showAssetNetworkIcon,
              }
            : undefined;

    if (!networkSymbol) return null;

    return (
        <Row gap={16} cursor="inherit">
            <Column alignItems="center">
                {assetLogo?.coingeckoId ? (
                    <AssetLogo
                        size={32}
                        coingeckoId={assetLogo.coingeckoId}
                        placeholder={assetLogo.placeholder}
                        symbol={networkSymbol}
                        contractAddress={assetLogo.contractAddress}
                        showNetworkIcon={assetLogo.showNetworkIcon}
                    />
                ) : (
                    <CoinLogo size={32} symbol={networkSymbol} type="tokenWithNetwork" />
                )}
            </Column>

            <Column flex="1" overflow="hidden" gap={2}>
                <EarnAccountCellDetails
                    account={account}
                    networkSymbol={networkSymbol}
                    tokenBalance={tokenBalance}
                    subtitle={subtitle}
                />
            </Column>
        </Row>
    );
};
