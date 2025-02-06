import { useSelector } from 'react-redux';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { GoBackIcon, ScreenHeader } from '@suite-native/navigation';
import { TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';

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
            content={
                <Text variant="highlight">
                    <Translation id="moduleSend.outputs.title" values={{ assetName }} />
                </Text>
            }
            leftIcon={<GoBackIcon />}
        />
    );
};
