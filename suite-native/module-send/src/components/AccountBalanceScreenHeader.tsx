import { useSelector } from 'react-redux';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import type { AccountsRootState } from '@suite-common/wallet-core';
import { selectAccountByKey } from '@suite-common/wallet-core';
import type { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';
import type { TokensRootState } from '@suite-native/tokens';
import { selectAccountTokenInfo } from '@suite-native/tokens';

type AccountBalanceScreenHeaderProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const AccountBalanceScreenHeader = ({
    accountKey,
    tokenContract,
}: AccountBalanceScreenHeaderProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const tokenInfo = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
    );

    if (!account) {
        return;
    }

    const assetName = (tokenInfo?.symbol ?? getNetworkDisplaySymbol(account.symbol)).toUpperCase();

    return (
        <ScreenHeader
            customContent={
                <Text variant="highlight">
                    <Translation id="moduleSend.outputs.title" values={{ assetName }} />
                </Text>
            }
        />
    );
};
