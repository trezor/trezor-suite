import { type AccountListSection, getAccountListSectionAmount } from '@suite-common/assets';
import { exhaustive } from '@trezor/type-utils';

import { useFiatFromCryptoValue } from '#src/hooks/suite/useFiatFromCryptoValue';

import { AccountAssetRow } from './AccountAssetRow';
import { AccountStakingRow } from './AccountStakingRow';

type AccountAssetSectionRowProps = {
    section: AccountListSection;
};

/** The table row of one section of the account's asset list. */
export const AccountAssetSectionRow = ({ section }: AccountAssetSectionRowProps) => {
    const networkSymbol = section.account.symbol;
    const holding = getAccountListSectionAmount(section);
    const { fiatAmount } = useFiatFromCryptoValue({
        symbol: networkSymbol,
        tokenAddress: holding?.tokenAddress,
        amount: holding?.amount,
    });
    const balance = holding === undefined ? null : { cryptoAmount: holding.amount, fiatAmount };

    switch (section.type) {
        case 'account':
            return <AccountAssetRow networkSymbol={networkSymbol} balance={balance} />;
        case 'staking':
            return (
                <AccountStakingRow
                    accountKey={section.account.key}
                    networkSymbol={networkSymbol}
                    balance={balance}
                />
            );
        case 'token':
            return (
                <AccountAssetRow
                    networkSymbol={networkSymbol}
                    contractAddress={section.token.contract}
                    tokenSymbol={section.token.symbol}
                    tokenDecimals={section.token.decimals}
                    balance={balance}
                />
            );
        // The tokens held at zero are listed as token sections, never as the group itself.
        case 'zeroBalance':
            return null;
        default:
            return exhaustive(section);
    }
};
