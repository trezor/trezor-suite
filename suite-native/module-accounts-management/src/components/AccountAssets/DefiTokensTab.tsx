import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type TokensRootState,
    selectAccountByKey,
    selectAccountDefiTokens,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { AccountsListTokenItem } from '@suite-native/accounts';
import { Box } from '@suite-native/atoms';

import { type OnSelectAsset } from './types';

type DefiTokensTabProps = {
    accountKey: AccountKey;
    onSelect: OnSelectAsset;
};

export const DefiTokensTab = ({ accountKey, onSelect }: DefiTokensTabProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const defiTokens = useSelector((state: TokensRootState) =>
        selectAccountDefiTokens(state, accountKey),
    );

    if (!account) return null;

    return (
        <Box>
            {defiTokens.map((token, index) => (
                <AccountsListTokenItem
                    key={token.contract}
                    token={token}
                    account={account}
                    hasBackground
                    isFirst={index === 0}
                    isLast={index === defiTokens.length - 1}
                    onSelectAccount={() =>
                        onSelect({ tokenContract: token.contract, tokenSymbol: token.symbol })
                    }
                />
            ))}
        </Box>
    );
};
