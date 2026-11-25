import { AssetIcon } from '@suite/assets';
import { createAssetId } from '@suite-common/asset-types';
import { type Account } from '@suite-common/wallet-types';
import { Row } from '@trezor/components';

import { AssetDetails } from '../AssetDetails';
import { ItemClickableContainer } from '../ItemClickableContainer';
import { AccountAmount } from './AccountAmount';

export type AssetRowAccountWithBalanceProps = {
    account: Account;
    dataTestId?: string;
    onClick?: (account: Account) => void;
    isFiatPrimary?: boolean;
    isInsideGroup?: boolean;
};

export function AssetRowAccountWithBalance({
    dataTestId,
    account,
    onClick,
    isFiatPrimary = false,
    isInsideGroup = false,
}: AssetRowAccountWithBalanceProps) {
    const isDisabled = !onClick;
    const assetId = createAssetId({ networkSymbol: account.symbol });

    return (
        <ItemClickableContainer
            onClick={() => {
                onClick?.(account);
            }}
            padding={isInsideGroup ? { left: 16, vertical: 12, right: 16 } : undefined}
            isDisabled={isDisabled}
        >
            <Row data-testid={dataTestId} gap={12} alignItems="center" overflow="hidden">
                <AssetIcon assetId={assetId} size={40} showNetworkIcon />
                <AssetDetails assetId={assetId} isDisabled={isDisabled} />
            </Row>
            <AccountAmount
                account={account}
                isFiatPrimary={isFiatPrimary}
                isDisabled={isDisabled}
            />
        </ItemClickableContainer>
    );
}
