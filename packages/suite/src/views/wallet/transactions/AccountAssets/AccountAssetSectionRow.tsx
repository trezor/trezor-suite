import { type AccountListSection, getAccountListSectionAmount } from '@suite-common/assets';
import { exhaustive } from '@trezor/type-utils';

import { AccountAssetRow } from './AccountAssetRow';
import { AccountStakingRow } from './AccountStakingRow';

type AccountAssetSectionRowProps = {
    section: AccountListSection;
    isOpenable?: boolean;
};

/** The table row of one section of the account's asset list. */
export const AccountAssetSectionRow = ({ section, isOpenable }: AccountAssetSectionRowProps) => {
    const amount = getAccountListSectionAmount(section)?.amount;

    switch (section.type) {
        case 'account':
            return <AccountAssetRow networkSymbol={section.account.symbol} amount={amount} />;
        case 'staking':
            return (
                <AccountStakingRow
                    accountKey={section.account.key}
                    networkSymbol={section.account.symbol}
                    amount={amount}
                />
            );
        case 'token':
            return (
                <AccountAssetRow
                    networkSymbol={section.account.symbol}
                    contractAddress={section.token.contract}
                    tokenSymbol={section.token.symbol}
                    tokenDecimals={section.token.decimals}
                    amount={amount}
                    isOpenable={isOpenable}
                />
            );
        // The tokens held at zero are listed as token sections, never as the group itself.
        case 'zeroBalance':
            return null;
        default:
            return exhaustive(section);
    }
};
