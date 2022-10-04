import React, { useMemo, useState } from 'react';
import { Alert, Share, View } from 'react-native';
import QRCode from 'react-qr-code';
import { useSelector } from 'react-redux';

import Clipboard from '@react-native-clipboard/clipboard';

import { Box, Button, HStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { defaultColorVariant } from '@trezor/theme';
import {
    TransactionsRootState,
    AccountsRootState,
    selectAccountByKey,
    selectPendingAccountAddresses,
    selectIsAccountUtxoBased,
} from '@suite-common/wallet-core';
import { getFirstFreshAddress } from '@suite-common/wallet-utils';

type FreshAddressStepProps = {
    accountKey: string;
    onClose: () => void;
};

export const QRCODE_SIZE = 197;
export const QRCODE_PADDING = 12;

const qrCodeStyle = prepareNativeStyle(_ => ({
    padding: QRCODE_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
}));

const actionButtonsStyle = prepareNativeStyle(_ => ({
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
}));

export const FreshAddressStep = ({ accountKey, onClose }: FreshAddressStepProps) => {
    const { applyStyle } = useNativeStyles();
    const [freshAddressError, setFreshAddressError] = useState();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const pendingAddresses = useSelector((state: TransactionsRootState) =>
        selectPendingAccountAddresses(state, accountKey),
    );
    const isAccountUtxoBased = useSelector((state: AccountsRootState) =>
        selectIsAccountUtxoBased(state, accountKey),
    );

    const freshAddress = useMemo(() => {
        if (account && pendingAddresses) {
            // Pass receive addresses empty. We proceed without address verification - not possible in watch only mode.
            try {
                return getFirstFreshAddress(account, [], pendingAddresses, isAccountUtxoBased);
            } catch (err) {
                setFreshAddressError(err.message);
            }
        }
    }, [account, pendingAddresses, isAccountUtxoBased]);

    const handleShareAddress = async () => {
        if (freshAddress) {
            try {
                await Share.share({
                    message: freshAddress.address,
                });
            } catch (error) {
                Alert.alert('Something went wrong.', error.message);
            }
        }
    };

    const handleCopyAddressToClipboardAndClose = async () => {
        if (freshAddress) {
            await Clipboard.setString(freshAddress.address);
            onClose();
        }
    };

    return (
        <Box>
            {!freshAddressError ? (
                <>
                    <View style={applyStyle(qrCodeStyle)}>
                        {freshAddress?.address && (
                            <QRCode
                                bgColor={defaultColorVariant.gray0}
                                fgColor={defaultColorVariant.gray900}
                                level="Q"
                                size={QRCODE_SIZE}
                                value={freshAddress.address}
                            />
                        )}
                    </View>
                    <Box margin="small" alignItems="center" justifyContent="center">
                        <Text variant="body">{freshAddress?.address}</Text>
                    </Box>
                    <HStack spacing={15} style={applyStyle(actionButtonsStyle)}>
                        <Button size="large" colorScheme="gray" onPress={handleShareAddress}>
                            Share
                        </Button>
                        <Button size="large" onPress={handleCopyAddressToClipboardAndClose}>
                            Copy & Close
                        </Button>
                    </HStack>
                </>
            ) : (
                'Something went wrong...'
            )}
        </Box>
    );
};
