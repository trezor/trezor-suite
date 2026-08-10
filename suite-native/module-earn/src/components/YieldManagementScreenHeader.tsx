import { useSelector } from 'react-redux';

import { type Account } from '@suite-common/wallet-types';
import { parseAccountKey } from '@suite-common/wallet-utils';
import {
    AccountLabel,
    type NativeAccountsRootState,
    selectAccountFiatBalance,
} from '@suite-native/accounts';
import { Box, HStack, IconButton, useBottomSheetModal } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { ScreenHeader } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { TokenSettingsBottomSheet } from './TokenSettingsBottomSheet';

const headerStyle = prepareNativeStyle(utils => ({
    flexShrink: 1,
    alignItems: 'center',
    gap: utils.spacings.sp8,
}));

const textColumnStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
}));

type YieldManagementScreenHeaderProps = {
    account: Account;
};

export const YieldManagementScreenHeader = ({ account }: YieldManagementScreenHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    const { networkSymbol, deviceStaticSessionId } = parseAccountKey(account.key);

    const fiatBalance = useSelector((state: NativeAccountsRootState) =>
        selectAccountFiatBalance(state, account.key),
    );

    const { bottomSheetRef, closeModal, openModal } = useBottomSheetModal();

    return (
        <>
            <ScreenHeader
                customContent={
                    <HStack spacing="sp12" style={applyStyle(headerStyle)}>
                        <TokenIcon symbol={networkSymbol} size="small" />
                        <Box style={applyStyle(textColumnStyle)}>
                            <AccountLabel
                                accountDescriptor={account.descriptor}
                                networkSymbol={networkSymbol}
                                deviceStaticSessionId={deviceStaticSessionId}
                                variant="body-md-strong"
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                showAccountTypeBadge
                            />

                            <BaseCurrencyAmountFormatter
                                value={fiatBalance}
                                variant="body-sm"
                                color="contentSecondary"
                            />
                        </Box>
                    </HStack>
                }
                rightIcon={
                    <IconButton
                        intent="neutral"
                        priority="secondary"
                        size="medium"
                        iconName="gear"
                        onPress={openModal}
                    />
                }
                closeActionType="back"
            />

            <TokenSettingsBottomSheet
                ref={bottomSheetRef}
                accountKey={account.key}
                onNavigateAway={closeModal}
            />
        </>
    );
};
