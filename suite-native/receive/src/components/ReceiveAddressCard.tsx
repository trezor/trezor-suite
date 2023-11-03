import Animated, { Layout } from 'react-native-reanimated';

import { Box, Card } from '@suite-native/atoms';
import { AddressQRCode } from '@suite-native/qr-code';

import { UnverifiedAddress } from './UnverifiedAddress';

type ReceiveAddressCardProps = {
    address: string;
    isReceiveApproved: boolean;
    isUnverifiedAddressRevealed: boolean;
    onShowAddress: () => void;
};

export const ReceiveAddressCard = ({
    address,
    isUnverifiedAddressRevealed,
    isReceiveApproved,
    onShowAddress,
}: ReceiveAddressCardProps) => (
    <Animated.View layout={Layout}>
        {/* TODO: display card alert according to design */}
        {/* https://github.com/trezor/trezor-suite/issues/9776 */}
        <Card>
            <Box paddingVertical="small">
                {isReceiveApproved ? (
                    <AddressQRCode address={address} />
                ) : (
                    <UnverifiedAddress
                        address={address}
                        isAddressRevealed={isUnverifiedAddressRevealed}
                        onShowAddress={onShowAddress}
                    />
                )}
            </Box>
        </Card>
    </Animated.View>
);
