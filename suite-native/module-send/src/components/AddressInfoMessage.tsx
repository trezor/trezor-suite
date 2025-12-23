import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Box, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { Link } from '@suite-native/link';

type AddressInfoMessageProps = {
    txId: TxKeyPath;
    link: string;
};
export const AddressInfoMessage = ({ txId, link }: AddressInfoMessageProps) => (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
        <HStack spacing="sp4" marginLeft="sp12" alignItems="center">
            <Icon name="info" size="medium" color="iconSubdued" />
            <Box flex={1}>
                <Text variant="label" color="textSubdued">
                    <Translation
                        id={txId}
                        values={{
                            link: linkChunk => (
                                <Link
                                    href={link}
                                    label={linkChunk}
                                    textVariant="label"
                                    isUnderlined
                                    textColor="textSubdued"
                                />
                            ),
                        }}
                    />
                </Text>
            </Box>
        </HStack>
    </Animated.View>
);
