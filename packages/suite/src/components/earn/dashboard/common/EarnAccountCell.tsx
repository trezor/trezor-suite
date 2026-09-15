import { type ReactNode } from 'react';

import { AssetIcon } from '@suite/asset-icon';
import { type TokenDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Column, Row } from '@trezor/components';

import { EarnAccountCellDetails } from './EarnAccountCellDetails';
import { type EarnTokenBalance } from './types';

type EarnAccountCellProps = {
    account?: Account;
    symbol?: NetworkSymbol;
    iconToken?: TokenDtoV2;
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
                {iconToken ? (
                    <AssetIcon
                        placeholder={iconToken.symbol || iconToken.name || ''}
                        symbol={networkSymbol}
                        contractAddress={iconToken.address ?? null}
                        showNetworkIcon={showAssetNetworkIcon}
                        size={32}
                        isBordered={false}
                        isTransparent={true}
                        wrappedTokenIcon="network"
                    />
                ) : (
                    <AssetIcon symbol={networkSymbol} size={32} isTransparent={true} />
                )}
            </Column>

            <Column flex="1" overflow="hidden" gap={4}>
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
