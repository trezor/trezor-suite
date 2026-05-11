import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Box, IconButton, useBottomSheetModal } from '@suite-native/atoms';

import { TokenSettingsBottomSheet } from './TokenSettingsBottomSheet';

type TokenScreenHeaderSettingsProps = {
    accountKey: AccountKey;
    tokenContract: TokenAddress;
};

export const TokenScreenHeaderSettings = ({
    accountKey,
    tokenContract,
}: TokenScreenHeaderSettingsProps) => {
    const { bottomSheetRef, openModal } = useBottomSheetModal();

    return (
        <Box>
            <IconButton
                intent="neutral"
                priority="secondary"
                iconName="gear"
                onPress={openModal}
                testID="@token-detail/settings-button"
            />
            <TokenSettingsBottomSheet
                ref={bottomSheetRef}
                accountKey={accountKey}
                tokenContract={tokenContract}
            />
        </Box>
    );
};
