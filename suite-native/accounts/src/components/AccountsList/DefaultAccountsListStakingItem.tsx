import { type Account } from '@suite-common/wallet-types';
import { RoundedIcon } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { useNativeStyles } from '@trezor/styles-native';

import { AccountsListItemBase } from './AccountsListItemBase';

type DefaultAccountsListStakingItemProps = {
    account: Account;
    stakingCryptoBalance: string;
    onPress: () => void;

    hasBackground?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
};

export const DefaultAccountsListStakingItem = ({
    account,
    stakingCryptoBalance,
    isLast,
    ...props
}: DefaultAccountsListStakingItemProps) => {
    const { utils } = useNativeStyles();

    return (
        <AccountsListItemBase
            {...props}
            isLast={isLast}
            showDivider={!isLast}
            icon={
                <RoundedIcon
                    name="piggyBankFilled"
                    color="iconSubdued"
                    containerSize={utils.spacings.sp32}
                />
            }
            title={<Translation id="accountList.staking" />}
            mainValue={
                <CryptoToFiatAmountFormatter
                    value={stakingCryptoBalance}
                    symbol={account.symbol}
                    isBalance
                />
            }
            secondaryValue={
                <CryptoAmountFormatter
                    value={stakingCryptoBalance}
                    symbol={account.symbol}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                />
            }
        />
    );
};
