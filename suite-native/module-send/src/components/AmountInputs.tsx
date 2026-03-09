import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { events } from '@suite-native/analytics';
import { ActiveView, BaseAmountInputs, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';

import { AmountErrorMessage } from './AmountErrorMessage';
import { CryptoAmountInput } from './CryptoAmountInput';
import { FiatAmountInput } from './FiatAmountInput';
import { SendMaxButton } from './SendMaxButton';

type AmountInputsProps = {
    index: number;
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    onInputSwitch?: (activeView: ActiveView) => void;
};

export const AmountInputs = ({
    index,
    accountKey,
    symbol,
    tokenContract,
    onInputSwitch,
}: AmountInputsProps) => {
    const analytics = useAnalytics();

    const handleInputSwitch = (activeView: ActiveView) => {
        analytics.report({
            type: events.sendAmountInputSwitchedEvent.name,
            payload: { changedTo: activeView === 'primary' ? 'crypto' : 'fiat' },
        });
        onInputSwitch?.(activeView);
    };

    return (
        <BaseAmountInputs
            index={index}
            accountKey={accountKey}
            symbol={symbol}
            tokenContract={tokenContract}
            onInputSwitch={handleInputSwitch}
            renderTopRow={() => (
                <>
                    <Text variant="body-sm">
                        <Translation id="moduleSend.outputs.recipients.amountLabel" />
                    </Text>
                    <SendMaxButton
                        outputIndex={index}
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                    />
                </>
            )}
            renderCryptoInput={({ onPress, isDisabled, inputRef }) => (
                <CryptoAmountInput
                    recipientIndex={index}
                    inputRef={inputRef}
                    accountKey={accountKey}
                    symbol={symbol}
                    tokenContract={tokenContract}
                    isDisabled={isDisabled}
                    onPress={onPress}
                />
            )}
            renderFiatInput={({ onPress, isDisabled, inputRef }) => (
                <FiatAmountInput
                    recipientIndex={index}
                    inputRef={inputRef}
                    accountKey={accountKey}
                    isDisabled={isDisabled}
                    symbol={symbol}
                    tokenContract={tokenContract}
                    onPress={onPress}
                />
            )}
            renderErrorMessage={isFiatDisplayed => (
                <AmountErrorMessage outputIndex={index} isFiatDisplayed={isFiatDisplayed} />
            )}
        />
    );
};
