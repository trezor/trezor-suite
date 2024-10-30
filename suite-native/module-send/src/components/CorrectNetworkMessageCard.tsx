import { CryptoIcon } from '@suite-native/icons';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { Card, HStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { isCoinWithTokens } from '@suite-native/tokens';

const cardStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation0,
    borderColor: utils.colors.borderElevation0,
    borderWidth: utils.borders.widths.small,
    paddingVertical: utils.spacings.sp12,

    ...utils.boxShadows.none,
}));

type CorrectNetworkMessageCardProps = {
    networkSymbol: NetworkSymbol;
};

const LINK_URL = 'https://trezor.io/learn/a/how-to-choose-the-right-network';

export const CorrectNetworkMessageCard = ({ networkSymbol }: CorrectNetworkMessageCardProps) => {
    const { applyStyle } = useNativeStyles();

    if (!isCoinWithTokens(networkSymbol)) return null;

    const networkName = networks[networkSymbol].name;

    return (
        <Card style={applyStyle(cardStyle)}>
            <HStack spacing="sp12">
                <CryptoIcon symbol={networkSymbol} size={20} />
                <Text variant="hint">
                    <Translation
                        id="moduleSend.outputs.correctNetworkMessage"
                        values={{
                            networkName,
                            link: linkChunk => (
                                <Link
                                    href={LINK_URL}
                                    label={linkChunk}
                                    isUnderlined
                                    textVariant="hint"
                                    textColor="textDefault"
                                />
                            ),
                        }}
                    />
                </Text>
            </HStack>
        </Card>
    );
};
