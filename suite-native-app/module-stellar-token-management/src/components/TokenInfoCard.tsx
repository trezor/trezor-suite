import { Pressable } from 'react-native';

import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TokenIcon, TokenName } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type TokenInfoCardProps = {
    networkSymbol: NetworkSymbol;
    tokenContract: TokenAddress;
    issuerDomain: string;
    iconContractAddress: TokenAddress | undefined;
    onPress: () => void;
};

const tokenCardStyle = prepareNativeStyle(utils => ({
    borderWidth: 1,
    borderColor: utils.colors.borderNeutral,
    borderRadius: utils.borders.radii.r12,
}));

export const TokenInfoCard = ({
    networkSymbol,
    tokenContract,
    issuerDomain,
    iconContractAddress,
    onPress,
}: TokenInfoCardProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable onPress={onPress}>
            <Card noPadding style={applyStyle(tokenCardStyle)}>
                <HStack justifyContent="space-between" alignItems="center" padding="sp16">
                    <VStack spacing="sp8">
                        <Text variant="body-md-strong">
                            <Translation id="moduleStellarToken.networkFee.token" />
                        </Text>
                        <Text variant="body-md-strong">
                            <Translation id="moduleStellarToken.tokenDetail.issuer" />
                        </Text>
                    </VStack>
                    <HStack alignItems="center" spacing="sp12">
                        <VStack spacing="sp8" alignItems="flex-end">
                            <HStack alignItems="center" spacing="sp8">
                                <TokenIcon
                                    networkSymbol={asNetworkSymbol('xlm')}
                                    contractAddress={iconContractAddress}
                                    size="extraSmall"
                                />
                                <TokenName
                                    networkSymbol={networkSymbol}
                                    contractAddress={tokenContract}
                                    variant="body-md"
                                />
                            </HStack>
                            <Text variant="body-md">{issuerDomain}</Text>
                        </VStack>
                        <Icon name="caretDown" color="contentSecondary" />
                    </HStack>
                </HStack>
            </Card>
        </Pressable>
    );
};
