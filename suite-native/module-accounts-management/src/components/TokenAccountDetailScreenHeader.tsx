import { useSelector } from 'react-redux';

import { Badge, Box, Text } from '@suite-native/atoms';
import { ScreenHeader } from '@suite-native/navigation';
import { AccountsRootState, selectAccountLabel } from '@suite-common/wallet-core';

type TokenAccountDetailScreenHeaderProps = {
    accountKey: string;
    tokenName: string;
};

export const TokenAccountDetailScreenHeader = ({
    accountKey,
    tokenName,
}: TokenAccountDetailScreenHeaderProps) => {
    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );

    return (
        <ScreenHeader
            hasGoBackIcon
            titleVariant="body"
            content={
                <Box alignItems="center">
                    <Text ellipsizeMode="tail" numberOfLines={1}>
                        {tokenName}
                    </Text>
                    <Badge
                        label={`Run on ${accountLabel}`}
                        icon="eth"
                        size="small"
                        iconSize="extraSmall"
                    />
                </Box>
            }
        />
    );
};
