import { getNetwork } from '@suite-common/wallet-config';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { HStack, IconButton, Text, VStack } from '@suite-native/atoms';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import { ScreenHeader } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type YieldDepositFlowScreenHeaderProps = {
    account: Account;
    closeAction?: () => void;
    onInfoPress: () => void;
    tokenContract: TokenAddress;
    vaultName: string;
};

const HEADER_TITLE_MAX_WIDTH = 150;

const titleContainerStyle = prepareNativeStyle(() => ({
    maxWidth: HEADER_TITLE_MAX_WIDTH,
}));

export const YieldDepositFlowScreenHeader = ({
    account,
    closeAction,
    onInfoPress,
    tokenContract,
    vaultName,
}: YieldDepositFlowScreenHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;

    return (
        <ScreenHeader
            closeActionType="close"
            closeAction={closeAction}
            customContent={
                <HStack spacing="sp8" alignItems="center">
                    <CryptoIconWithNetwork
                        symbol={account.symbol}
                        contractAddress={tokenContract}
                        size="small"
                    />
                    <VStack spacing={0} style={applyStyle(titleContainerStyle)}>
                        <Text variant="body-md" numberOfLines={1} ellipsizeMode="tail">
                            {vaultName}
                        </Text>
                        <Text
                            variant="body-xs"
                            color="contentSecondary"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {accountLabel}
                        </Text>
                    </VStack>
                </HStack>
            }
            rightIcon={
                <IconButton
                    intent="neutral"
                    priority="secondary"
                    size="medium"
                    iconName="info"
                    onPress={onInfoPress}
                />
            }
        />
    );
};
