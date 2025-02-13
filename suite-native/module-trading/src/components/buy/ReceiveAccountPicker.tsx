import { ReactNode } from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { Color } from '@trezor/theme';

import { useTradeSheetControls } from '../../hooks/useTradeSheetControls';
import { ReceiveAccount } from '../../types';
import { AccountSheet } from '../general/AccountSheet/AccountSheet';
import { TradingOverviewRow } from '../general/TradingOverviewRow';

type RightTextProps = {
    children: ReactNode;
    color: Color;
    variant?: 'body' | 'hint';
};

type ReceiveAccountPickerRightProps = {
    selectedAccountLabel: string | undefined;
    selectedAddress: string | undefined;
    selectedSymbol: NetworkSymbol | undefined;
};

export type ReceiveAccountPickerProps = {
    selectedSymbol?: NetworkSymbol;
} & ReturnType<typeof useTradeSheetControls<ReceiveAccount>>;

const RightText = ({ color, variant = 'body', children }: RightTextProps) => (
    <Text color={color} variant={variant} textAlign="right" ellipsizeMode="tail" numberOfLines={1}>
        {children}
    </Text>
);

const ReceiveAccountPickerRight = ({
    selectedAccountLabel,
    selectedAddress,
    selectedSymbol,
}: ReceiveAccountPickerRightProps) => {
    if (!selectedSymbol) {
        return (
            <RightText color="textDisabled">
                <Translation id="moduleTrading.selectCoinFirst" />
            </RightText>
        );
    }

    if (!selectedAccountLabel) {
        return (
            <RightText color="textDisabled">
                <Translation id="moduleTrading.notSelected" />
            </RightText>
        );
    }

    if (!selectedAddress) {
        return <RightText color="textSubdued">{selectedAccountLabel}</RightText>;
    }

    return (
        <>
            <RightText color="textSubdued">{selectedAccountLabel}</RightText>
            <RightText color="textSubdued" variant="hint">
                {selectedAddress}
            </RightText>
        </>
    );
};

export const ReceiveAccountPicker = ({
    selectedSymbol,
    isSheetVisible,
    hideSheet,
    showSheet,
    setSelectedValue,
    selectedValue,
}: ReceiveAccountPickerProps) => {
    const { translate } = useTranslate();

    const onPress = selectedSymbol ? showSheet : undefined;

    return (
        <>
            <TradingOverviewRow
                title={translate('moduleTrading.tradingScreen.receiveAccount')}
                onPress={onPress}
                noBottomBorder
            >
                <VStack spacing={0} paddingLeft="sp20">
                    <ReceiveAccountPickerRight
                        selectedAccountLabel={selectedValue?.account.accountLabel}
                        selectedAddress={selectedValue?.address?.address}
                        selectedSymbol={selectedSymbol}
                    />
                </VStack>
            </TradingOverviewRow>
            {selectedSymbol && (
                <AccountSheet
                    symbol={selectedSymbol}
                    onAccountSelect={setSelectedValue}
                    isVisible={isSheetVisible}
                    onClose={hideSheet}
                />
            )}
        </>
    );
};
