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
};

type ReceiveAccountPickerProps = {
    selectedSymbol?: NetworkSymbol;
};

const RightText = ({ color, variant = 'body', children }: RightTextProps) => (
    <Text color={color} variant={variant} textAlign="right" ellipsizeMode="tail" numberOfLines={1}>
        {children}
    </Text>
);

const ReceiveAccountPickerRight = ({
    selectedAccountLabel,
    selectedAddress,
}: ReceiveAccountPickerRightProps) => {
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

export const ReceiveAccountPicker = ({ selectedSymbol }: ReceiveAccountPickerProps) => {
    const { translate } = useTranslate();

    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useTradeSheetControls<ReceiveAccount>();

    return (
        <>
            <TradingOverviewRow
                title={translate('moduleTrading.tradingScreen.receiveAccount')}
                onPress={showSheet}
                noBottomBorder
            >
                <VStack spacing={0} paddingLeft="sp20">
                    <ReceiveAccountPickerRight
                        selectedAccountLabel={selectedValue?.account.accountLabel}
                        selectedAddress={selectedValue?.address?.address}
                    />
                </VStack>
            </TradingOverviewRow>
            <AccountSheet
                symbol={selectedSymbol ?? 'btc'}
                onAccountSelect={setSelectedValue}
                isVisible={isSheetVisible}
                onClose={hideSheet}
            />
        </>
    );
};
