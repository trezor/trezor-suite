import { type TokenDto } from '@suite-common/earn-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Column, Row } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

import { VaultTokenLogo } from 'src/components/earn/common/VaultTokenLogo';

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

    if (!networkSymbol) return null;

    return (
        <Row gap={16} cursor="inherit">
            <Column alignItems="center">
                {iconToken ? (
                    <VaultTokenLogo
                        token={iconToken}
                        networkSymbol={networkSymbol}
                        size={32}
                        showNetworkIcon={showAssetNetworkIcon}
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
