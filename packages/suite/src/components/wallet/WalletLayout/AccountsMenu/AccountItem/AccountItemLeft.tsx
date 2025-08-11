import { Column, Icon } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { exhaustive } from '@trezor/type-utils';

import { TokensWithRates } from 'src/utils/wallet/tokenUtils';

import { Account, AccountItemType } from '../../../../../types/wallet';
import { TokenIconSetWrapper } from '../../../TokenIconSetWrapper';

const ICON_SIZE = 24;
type AccountItemLeftProps = {
    account: Account;
    type: AccountItemType;
    tokens?: TokensWithRates[];
    onClick?: () => void;
};
export const AccountItemLeft = ({ type, account, tokens, onClick }: AccountItemLeftProps) => {
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
            return (
                <TokenIconSetWrapper symbol={account.symbol} tokens={tokens} onClick={onClick} />
            );
        default:
            return exhaustive(type);
    }
};
