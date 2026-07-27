import { getNetwork } from '@suite-common/wallet-config';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { HStack, IconButton, Text, VStack } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { ScreenHeader } from '@suite-native/navigation';

type YieldDepositFlowScreenHeaderProps = {
    account: Account;
    closeAction?: () => void;
    onInfoPress: () => void;
    tokenContract: TokenAddress;
    vaultName: string;
};

export const YieldDepositFlowScreenHeader = ({
    account,
    closeAction,
    onInfoPress,
    tokenContract,
    vaultName,
}: YieldDepositFlowScreenHeaderProps) => {
    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;

    return (
        <ScreenHeader
            closeActionType="close"
            closeAction={closeAction}
            customContent={
                <HStack spacing="sp8" alignItems="center" flexShrink={1}>
                    <TokenIcon
                        symbol={account.symbol}
                        contractAddress={tokenContract}
                        size="small"
                        showNetworkIcon
                    />
                    <VStack spacing={0} flexShrink={1}>
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
