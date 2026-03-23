import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Card, HStack, Text } from '@suite-native/atoms';
import { NetworkIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { HOW_TO_CHOOSE_RIGHT_NETWORK_URL } from '@trezor/urls';

const cardStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation1,
    borderColor: utils.colors.borderElevation0,
    borderWidth: utils.borders.widths.small,
    paddingVertical: utils.spacings.sp12,

    ...utils.boxShadows.none,
}));

type CorrectNetworkMessageCardProps = {
    symbol: NetworkSymbol;
};

export const CorrectNetworkMessageCard = ({ symbol }: CorrectNetworkMessageCardProps) => {
    const { applyStyle } = useNativeStyles();

    const network = getNetwork(symbol);

    if (network.networkType !== 'ethereum') return null;

    return (
        <Card style={applyStyle(cardStyle)}>
            <HStack spacing="sp12" alignItems="center">
                <NetworkIcon symbol={symbol} size="extraLarge" />
                <Text variant="body-sm">
                    <Translation
                        id="moduleSend.outputs.correctNetworkMessage"
                        values={{
                            networkName: network.name,
                            link: linkChunk => {
                                const label = (linkChunk[0] as string) ?? '';

                                return (
                                    <Link
                                        key={label}
                                        href={HOW_TO_CHOOSE_RIGHT_NETWORK_URL}
                                        label={label}
                                        isUnderlined
                                        textVariant="body-sm"
                                        textColor="textDefault"
                                    />
                                );
                            },
                        }}
                    />
                </Text>
            </HStack>
        </Card>
    );
};
