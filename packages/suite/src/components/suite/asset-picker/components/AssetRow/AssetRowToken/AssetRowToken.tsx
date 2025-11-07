import { memo } from 'react';

import { Account } from '@suite-common/wallet-types';
import { TokenInfo } from '@trezor/blockchain-link-types';
import { Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { AssetAmount } from './AssetAmount';
import { AssetDetails } from './AssetDetails';
import { AssetImage } from '../AssetImage';
import { ItemClickableContainer } from '../ItemClickableContainer';

export const ASSET_ROW_TOKEN_HEIGHT = 68;

export type AssetRowTokenProps = {
    token: TokenInfo;
    account: Account;
    onClick: (token: TokenInfo, account: Account) => void;
    'data-testid'?: string;
};

export const AssetRowToken = memo(function AssetRowTokenInner({
    token,
    account,
    'data-testid': dataTestId,
    onClick,
}: AssetRowTokenProps) {
    return (
        <ItemClickableContainer
            onClick={() => {
                onClick(token, account);
            }}
        >
            <Row data-testid={dataTestId} gap={spacings.sm}>
                <AssetImage
                    networkType={account.networkType}
                    networkSymbol={account.symbol}
                    contractAddress={token.contract}
                    symbol={token.symbol!}
                />
                <AssetDetails
                    name={token.name!}
                    symbol={token.symbol!}
                    networkSymbol={account.symbol}
                />
            </Row>
            {token.balance && (
                <AssetAmount
                    symbol={token.symbol!}
                    // fiatAmount={fiatAmount}
                    contractAddress={token.contract}
                    amount={token.balance}
                />
            )}
        </ItemClickableContainer>
    );
});
