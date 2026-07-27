import type { BankAccount } from 'invity-api';

import { sellUtils } from '@suite-common/trading';
import { HStack, Radio, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow } from '@suite-native/trading-atoms';
import { exhaustive } from '@trezor/type-utils';

export type AccessoryType = 'caret' | 'select' | 'none';

export type SellBankAccountItemP = {
    bankAccount: BankAccount;
    accessoryType: AccessoryType;
    noBorder?: boolean;
    isSelected?: boolean;
    onPress?: () => void;
};

export type AccessoryViewProps = {
    accessoryType: AccessoryType;
    isSelected: boolean;
    onPress: () => void;
};

export const BANK_ACCOUNT_ITEM_TEST_ID = '@trading/sell/bank-account-item';

const AccessoryView = ({ accessoryType, isSelected, onPress }: AccessoryViewProps) => {
    switch (accessoryType) {
        case 'caret':
            return <Icon name="caretRight" size="medium" testID="caret-right-icon" />;
        case 'select':
            return (
                <Radio
                    value="select"
                    onPress={onPress}
                    isChecked={isSelected}
                    testID="radio-button-select"
                />
            );
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
}: SellBankAccountItemP) => (
    <TradeInfoRow onPress={onPress} noBorder={noBorder} testID={BANK_ACCOUNT_ITEM_TEST_ID}>
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
        <AccessoryView accessoryType={accessoryType} isSelected={isSelected} onPress={onPress} />
    </TradeInfoRow>
);
