import { memo } from 'react';

import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { ExchangePreviewFooterContainer } from './ExchangePreviewFooterContainer';
import { useExchangeSignTransaction } from '../../../hooks/exchange/useExchangeSignTransaction';

export type ExchangePreviewContinueButtonProps = {
    isDisabled: boolean;
    onSignTransactionNavigation: () => void;
};

const EXCHANGE_PREVIEW_CONTINUE_BUTTON_TEST_ID = '@trading/exchange-preview/continue-button';

export const ExchangePreviewContinueButton = memo(
    ({ isDisabled, onSignTransactionNavigation }: ExchangePreviewContinueButtonProps) => {
        const {
            handleSignTransaction,
            isSignDataFlow,
            isTXFinalType,
            isTradeFinalized,
            isSigningPreparationLoading,
        } = useExchangeSignTransaction({ onSignTransactionNavigation });

        const shouldHideContinue =
            isTradeFinalized || (!isSignDataFlow && isDisabled && !isTXFinalType);

        if (shouldHideContinue) {
            return null;
        }

        return (
            <ExchangePreviewFooterContainer>
                <Button
                    onPress={handleSignTransaction}
                    isDisabled={isDisabled}
                    isLoading={isSigningPreparationLoading}
                    testID={EXCHANGE_PREVIEW_CONTINUE_BUTTON_TEST_ID}
                >
                    <Translation id="generic.buttons.continue" />
                </Button>
            </ExchangePreviewFooterContainer>
        );
    },
);
