import { Column, Icon } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { exhaustive } from '@trezor/type-utils';

import { Account, AccountItemType } from '../../../../../types/wallet';
import { TokenIconSetWrapper } from '../../../TokenIconSetWrapper';

const ICON_SIZE = 24;
type AccountItemLeftProps = {
    type: AccountItemType;
    account: Account;
};
export const AccountItemLeft = ({ type, account }: AccountItemLeftProps) => {
    switch (type) {
        case 'coin':
            return (
                <Column alignItems="center">
                    <CoinLogo size={ICON_SIZE} symbol={account.symbol} />
                </Column>
            );
        case 'staking':
            return <Icon name="piggyBankFilled" variant="tertiary" />;
        case 'tokens':
            return <TokenIconSetWrapper accounts={[account]} symbol={account.symbol} />;
        default:
            return exhaustive(type);
    }
};
