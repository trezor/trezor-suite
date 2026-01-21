import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Box, HStack, Text } from '@suite-native/atoms';
import { Icon, IconColor, IconName } from '@suite-native/icons';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { Color } from '@trezor/theme';

type AddressInfoMessageType = 'info' | 'warning';
type AddressInfoMessageProps = {
    txId: TxKeyPath;
    link: string;
    type?: AddressInfoMessageType;
};

const stylesByType: Record<
    AddressInfoMessageType,
    { color: Color; icon: IconName; iconColor: IconColor }
> = {
    info: {
        color: 'textSubdued',
        icon: 'info',
        iconColor: 'textSubdued',
    },
    warning: {
        color: 'textAlertYellow',
        icon: 'warning',
        iconColor: 'iconAlertYellow',
    },
};

export const AddressInfoMessage = ({ txId, link, type = 'info' }: AddressInfoMessageProps) => {
    const { color, icon, iconColor } = stylesByType[type];

    return (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
            <HStack spacing="sp4" marginLeft="sp12" alignItems="center">
                <Icon name={icon} size="medium" color={iconColor} />
                <Box flex={1}>
                    <Text variant="label" color={color}>
                        <Translation
                            id={txId}
                            values={{
                                link: linkChunk => (
                                    <Link
                                        href={link}
                                        label={linkChunk}
                                        textVariant="label"
                                        isUnderlined
                                        textColor={color}
                                    />
                                ),
                            }}
                        />
                    </Text>
                </Box>
            </HStack>
        </Animated.View>
    );
};
