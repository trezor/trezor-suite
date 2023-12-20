import { A, pipe } from '@mobily/ts-belt';

import { Box, Text, VStack } from '@suite-native/atoms';
import { splitAddressToChunks } from '@suite-native/helpers';

import { QRCode } from './QRCode';

type AddressQRCodeProps = {
    address: string;
};

export const AddressQRCode = ({ address }: AddressQRCodeProps) => {
    const formattedAddress = pipe(address, splitAddressToChunks, A.join(' '));

    return (
        <VStack spacing="large">
            <QRCode data={address} />
            <Box alignItems="center" justifyContent="center">
                <Text variant="titleSmall" textAlign="center">
                    {formattedAddress}
                </Text>
            </Box>
        </VStack>
    );
};
