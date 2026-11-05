import { Pressable } from 'react-native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon, TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TokenName, useTokenMetadata } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type TokenInfoCardProps = {
    networkSymbol: NetworkSymbol;
    issuerDomain: string;
    iconContractAddress: TokenAddress | undefined;
    tokenContract: TokenAddress;
    onPress: () => void;
};

const tokenCardStyle = prepareNativeStyle(utils => ({
    borderWidth: 1,
    borderColor: utils.colors.borderNeutral,
    borderRadius: utils.borders.radii.r12,
}));

export const TokenInfoCard = ({
    networkSymbol,
    issuerDomain,
    iconContractAddress,
    tokenContract,
    onPress,
}: TokenInfoCardProps) => {
    const { applyStyle } = useNativeStyles();
    const token = useTokenMetadata(networkSymbol, tokenContract);
    const tokenName = token?.name ?? token?.symbol ?? '';

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
                                    networkSymbol={networkSymbol}
                                    contractAddress={iconContractAddress}
                                    tokenSymbol={tokenName}
                                    size="extraSmall"
                                />
                                <TokenName
                                    networkSymbol={networkSymbol}
                                    contractAddress={tokenContract}
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
