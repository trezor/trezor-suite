import { AssetIcon } from '@suite/assets';
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

    return (
        <ItemClickableContainer
            onClick={() => {
                onClick?.(account);
            }}
            padding={isInsideGroup ? { left: 16, vertical: 12, right: 16 } : undefined}
            isDisabled={isDisabled}
        >
            <Row data-testid={dataTestId} gap={12} alignItems="center" overflow="hidden">
                <AssetIcon networkSymbol={account.symbol} size={40} showNetworkIcon />
                <AssetDetails networkSymbol={account.symbol} isDisabled={isDisabled} />
            </Row>
            <AccountAmount
                account={account}
                isFiatPrimary={isFiatPrimary}
                isDisabled={isDisabled}
            />
        </ItemClickableContainer>
    );
}
