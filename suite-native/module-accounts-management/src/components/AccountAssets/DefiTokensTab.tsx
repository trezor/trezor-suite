import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type AccountsRootState,
    type TokensRootState,
    selectAccountByKey,
    selectAccountDefiTokens,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { AccountsListTokenItem } from '@suite-native/accounts';
import { Box } from '@suite-native/atoms';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type DefiTokensTabProps = {
    accountKey: AccountKey;
};

export const DefiTokensTab = ({ accountKey }: DefiTokensTabProps) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountAssets>>();

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
                        navigation.navigate(RootStackRoutes.AccountDetail, {
                            accountKey,
                            tokenContract: token.contract,
                            closeActionType: 'back',
                        })
                    }
                />
            ))}
        </Box>
    );
};
