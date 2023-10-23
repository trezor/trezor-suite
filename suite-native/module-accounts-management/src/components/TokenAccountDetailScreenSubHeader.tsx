import { useSelector } from 'react-redux';

import { Box, HStack, Text } from '@suite-native/atoms';
import { ScreenSubHeader } from '@suite-native/navigation';
import { AccountsRootState, selectAccountLabel } from '@suite-common/wallet-core';
import { CryptoIcon } from '@suite-common/icons';
import { useTranslate } from '@suite-native/intl';

type TokenAccountDetailScreenHeaderProps = {
    accountKey: string;
    tokenName: string;
};

export const TokenAccountDetailScreenSubHeader = ({
    accountKey,
    tokenName,
}: TokenAccountDetailScreenHeaderProps) => {
    const { translate } = useTranslate();
    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );

    return (
        <ScreenSubHeader
            content={
                <Box alignItems="center">
                    <Text ellipsizeMode="tail" numberOfLines={1}>
                        {tokenName}
                    </Text>
                    <HStack spacing="extraSmall" alignItems="center">
                        <CryptoIcon symbol="eth" size="extraSmall" />
                        <Text
                            variant="label"
                            color="textSubdued"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {translate('moduleAccounts.accountDetail.accountLabelBadge', {
                                accountLabel,
                            })}
                        </Text>
                    </HStack>
                </Box>
            }
        />
    );
};
