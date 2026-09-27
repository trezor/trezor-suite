import type { BankAccount } from 'invity-api';

import { sellUtils } from '@suite-common/trading';
import { HStack, RadioIndicator, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow } from '@suite-native/trading-atoms';
import { exhaustive } from '@trezor/type-utils';

export type AccessoryType = 'caret' | 'select' | 'none';

export type SellBankAccountItemProps = {
    bankAccount: BankAccount;
    accessoryType: AccessoryType;
    noBorder?: boolean;
    isSelected?: boolean;
    onPress?: () => void;
};

export type SellBankAccountAccessoryProps = {
    accessoryType: AccessoryType;
    isSelected: boolean;
};

export const BANK_ACCOUNT_ITEM_TEST_ID = '@trading/sell/bank-account-item';

const AccessoryView = ({ accessoryType, isSelected }: SellBankAccountAccessoryProps) => {
    switch (accessoryType) {
        case 'caret':
            return <Icon name="caretRight" size="medium" testID="caret-right-icon" />;
        case 'select':
            return <RadioIndicator isChecked={isSelected} testID="radio-button-select" />;
        case 'none':
            return null;

        default:
            return exhaustive(accessoryType);
    }
};

export const SellBankAccountItem = ({
    bankAccount,
    isSelected = false,
    accessoryType,
    noBorder = false,
    onPress = () => {},
}: SellBankAccountItemProps) => (
    <TradeInfoRow
        onPress={onPress}
        noBorder={noBorder}
        testID={BANK_ACCOUNT_ITEM_TEST_ID}
        accessibilityRole={accessoryType === 'select' ? 'radio' : 'button'}
        accessibilityState={
            accessoryType === 'select' ? { checked: isSelected, selected: isSelected } : undefined
        }
    >
        <VStack spacing={0}>
            <Text variant="body-sm">{bankAccount.holder}</Text>
            <Text variant="body-sm" color="contentSecondary">
                {sellUtils.formatIban(bankAccount.bankAccount)}
            </Text>
            {bankAccount.verified ? (
                <HStack spacing="sp8">
                    <Icon
                        name="check"
                        size="mediumLarge"
                        testID="check-icon"
                        color="contentBrand"
                    />
                    <Text variant="body-sm" color="contentBrand">
                        <Translation id="moduleTrading.tradingSellPreviewScreen.verified" />
                    </Text>
                </HStack>
            ) : (
                <Text variant="body-sm" color="contentSecondary">
                    <Translation id="moduleTrading.tradingSellPreviewScreen.notVerified" />
                </Text>
            )}
        </VStack>
        <AccessoryView accessoryType={accessoryType} isSelected={isSelected} />
    </TradeInfoRow>
);
