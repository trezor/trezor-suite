import { useState } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { type ActiveView, BaseAmountInputs, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { EarnAmountErrorMessage } from './EarnAmountErrorMessage';
import { EarnCryptoAmountInput } from './EarnCryptoAmountInput';
import { EarnFiatAmountInput } from './EarnFiatAmountInput';
import { EarnMaxButton, type EarnMaxButtonVariant } from './EarnMaxButton';
import { EarnWithdrawalFeesBanner } from './EarnWithdrawalFeesBanner';

type EarnAmountInputsProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    maxButtonVariant?: EarnMaxButtonVariant;
    isWithdrawalFeesBannerVisible?: boolean;
    onCurrencyChange?: (activeView: ActiveView) => void;
};

export const EarnAmountInputs = ({
    accountKey,
    symbol,
    maxButtonVariant,
    isWithdrawalFeesBannerVisible = true,
    onCurrencyChange,
}: EarnAmountInputsProps) => {
    const [isMaxSelected, setIsMaxSelected] = useState(false);

    return (
        <VStack spacing="sp12">
            <BaseAmountInputs
                symbol={symbol}
                onInputSwitch={onCurrencyChange}
                renderTopRow={() => (
                    <>
                        <Text variant="body-sm">
                            <Translation id="earn.earnFormScreen.amountLabel" />
                        </Text>
                        <EarnMaxButton
                            accountKey={accountKey}
                            symbol={symbol}
                            isChecked={isMaxSelected}
                            onChange={setIsMaxSelected}
                            variant={maxButtonVariant}
                        />
                    </>
                )}
                renderCryptoInput={({ onPress, isDisabled, inputRef }) => (
                    <EarnCryptoAmountInput
                        symbol={symbol}
                        inputRef={inputRef}
                        isDisabled={isMaxSelected || isDisabled}
                        onPress={onPress}
                    />
                )}
                renderFiatInput={({ onPress, isDisabled, inputRef }) => (
                    <EarnFiatAmountInput
                        symbol={symbol}
                        inputRef={inputRef}
                        isDisabled={isMaxSelected || isDisabled}
                        onPress={onPress}
                    />
                )}
                renderErrorMessage={isFiatDisplayed => (
                    <EarnAmountErrorMessage isFiatDisplayed={isFiatDisplayed} />
                )}
            />
            {isWithdrawalFeesBannerVisible && (
                <EarnWithdrawalFeesBanner accountKey={accountKey} symbol={symbol} />
            )}
        </VStack>
    );
};
