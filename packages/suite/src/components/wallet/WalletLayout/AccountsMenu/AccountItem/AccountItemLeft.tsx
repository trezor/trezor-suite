import { NetworkSymbol } from '@suite-common/wallet-config';
import { CoinLogo } from '@trezor/product-components';
import { Column, Icon } from '@trezor/components';

import { TokenIconSetWrapper } from '../../../TokenIconSetWrapper';
import { Account, AccountItemType } from '../../../../../types/wallet';

const ICON_SIZE = 24;
type AccountItemLeftProps = {
    type: AccountItemType;
    symbol: NetworkSymbol;
    account: Account;
};
export const AccountItemLeft = ({ type, symbol, account }: AccountItemLeftProps) => {
    switch (type) {
        case 'coin':
            return (
                <Column alignItems="center">
                    <CoinLogo size={ICON_SIZE} symbol={symbol} />
                </Column>
            );
        case 'staking':
            return <Icon name="piggyBankFilled" variant="tertiary" />;
        case 'tokens':
            return <TokenIconSetWrapper accounts={[account]} symbol={account.symbol} />;
    }
};
