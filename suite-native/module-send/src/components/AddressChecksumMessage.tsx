import { Link } from '@suite-native/link';
import { HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

const LINK_URL = 'https://trezor.io/learn/a/evm-address-checksum-in-trezor-suite';

export const AddressChecksumMessage = () => (
    <HStack>
        <Icon name="info" size="medium" color="iconSubdued" />
        <Text variant="label" color="textSubdued">
            <Translation
                id="moduleSend.outputs.recipients.checksum.label"
                values={{
                    link: linkChunk => (
                        <Link
                            href={LINK_URL}
                            label={linkChunk}
                            textVariant="label"
                            isUnderlined
                            textColor="textSubdued"
                        />
                    ),
                }}
            />
        </Text>
    </HStack>
);
