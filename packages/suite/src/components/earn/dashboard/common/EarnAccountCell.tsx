import { type ReactNode } from 'react';

import { type TokenDto } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Column, Row } from '@trezor/components';
import { AssetLogo } from '@trezor/product-components';

import { EarnAccountCellDetails } from './EarnAccountCellDetails';
import { type EarnTokenBalance } from './types';

type EarnAccountCellProps = {
    account?: Account;
    symbol?: NetworkSymbol;
    iconToken?: TokenDto;
    showAssetNetworkIcon?: boolean;
    tokenBalance?: EarnTokenBalance;
    subtitle?: ReactNode;
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
                <AssetLogo
                    placeholder={iconToken?.symbol || iconToken?.name || ''}
                    symbol={networkSymbol}
                    contractAddress={iconToken?.address ?? null}
                    showNetworkIcon={showAssetNetworkIcon}
                    size={32}
                />
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
