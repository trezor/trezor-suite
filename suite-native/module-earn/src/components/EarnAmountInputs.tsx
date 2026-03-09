import { useState } from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountKey } from '@suite-common/wallet-types';
import { BaseAmountInputs, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { EarnAmountErrorMessage } from './EarnAmountErrorMessage';
import { EarnCryptoAmountInput } from './EarnCryptoAmountInput';
import { EarnFiatAmountInput } from './EarnFiatAmountInput';
import { EarnMaxButton } from './EarnMaxButton';
import { EarnWithdrawalFeesBanner } from './EarnWithdrawalFeesBanner';

type EarnAmountInputsProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
};

export const EarnAmountInputs = ({ accountKey, symbol }: EarnAmountInputsProps) => {
    const [isStakeMax, setIsStakeMax] = useState(false);

    return (
        <VStack spacing="sp12">
            <BaseAmountInputs
                index={0}
                accountKey={accountKey}
                symbol={symbol}
                tokenContract={undefined}
                renderTopRow={() => (
                    <>
                        <Text variant="body-sm">
                            <Translation id="earn.earnFormScreen.amountLabel" />
                        </Text>
                        <EarnMaxButton
                            accountKey={accountKey}
                            symbol={symbol}
                            isChecked={isStakeMax}
                            onChange={setIsStakeMax}
                        />
                    </>
                )}
                renderCryptoInput={({ onPress, isDisabled, inputRef }) => (
                    <EarnCryptoAmountInput
                        symbol={symbol}
                        inputRef={inputRef}
                        isDisabled={isStakeMax || isDisabled}
                        onPress={onPress}
                    />
                )}
                renderFiatInput={({ onPress, isDisabled, inputRef }) => (
                    <EarnFiatAmountInput
                        symbol={symbol}
                        accountKey={accountKey}
                        inputRef={inputRef}
                        isDisabled={isStakeMax || isDisabled}
                        onPress={onPress}
                    />
                )}
                renderErrorMessage={isFiatDisplayed => (
                    <EarnAmountErrorMessage isFiatDisplayed={isFiatDisplayed} />
                )}
            />
            <EarnWithdrawalFeesBanner accountKey={accountKey} symbol={symbol} />
        </VStack>
    );
};
