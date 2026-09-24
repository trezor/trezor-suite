import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type WalletSettingsRootState,
    selectAccountFormattedBalance,
    selectIsAmountInSats,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Button, HStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { KeyboardToolbarPortal } from '@suite-native/keyboard';
import { type TokensRootState, selectAccountTokenBalance } from '@suite-native/tokens';

import {
    MAX_TRADING_TOOLBAR_PERCENTAGE,
    TRADING_TOOLBAR_PERCENTAGES,
    getTradingToolbarAmount,
} from '../../utils/general/getTradingToolbarAmount';

type CryptoAmountKeyboardToolbarProps = {
    accountKey: AccountKey | undefined;
    symbol: NetworkSymbol | undefined;
    contractAddress: TokenAddress | undefined;
    decimals: number | undefined;
    isVisible?: boolean;
    maxSpendableAmount: string | undefined;
    onSelectAmount: (amount: string | undefined) => void;
};

export const TRADING_KEYBOARD_TOOLBAR_HOST = 'trading-keyboard-toolbar';

export const CryptoAmountKeyboardToolbar = ({
    accountKey,
    symbol,
    contractAddress,
    decimals,
    isVisible = false,
    maxSpendableAmount,
    onSelectAmount,
}: CryptoAmountKeyboardToolbarProps) => {
    const balance = useSelector((state: AccountsRootState & TokensRootState) =>
        contractAddress
            ? selectAccountTokenBalance(state, accountKey, contractAddress)
            : selectAccountFormattedBalance(state, accountKey),
    );
    const isAmountInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, symbol),
    );

    return (
        <KeyboardToolbarPortal hostName={TRADING_KEYBOARD_TOOLBAR_HOST} isVisible={isVisible}>
            <HStack spacing="sp8">
                {TRADING_TOOLBAR_PERCENTAGES.map(percentage => {
                    const isMax = percentage === MAX_TRADING_TOOLBAR_PERCENTAGE;
                    const amount = getTradingToolbarAmount({
                        amount: isMax ? maxSpendableAmount : (balance ?? undefined),
                        percentage,
                        decimals,
                        isAmountInSats,
                    });

                    return (
                        <Button
                            key={percentage}
                            flex={1}
                            size="medium"
                            intent="neutral"
                            priority="secondary"
                            isDisabled={amount === undefined}
                            onPress={() => onSelectAmount(amount)}
                        >
                            {isMax ? (
                                <Translation id="moduleTrading.keyboardToolbar.max" />
                            ) : (
                                `${percentage}%`
                            )}
                        </Button>
                    );
                })}
            </HStack>
        </KeyboardToolbarPortal>
    );
};
