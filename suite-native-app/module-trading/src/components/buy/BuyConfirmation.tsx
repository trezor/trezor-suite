import { type AnimatedProps, FadeIn, FadeOutDown } from 'react-native-reanimated';

import { AnimatedBox, Button } from '@suite-native/atoms';
import { useWatch } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';

import { useBuyFlow } from '../../hooks/buy/useBuyFlow';
import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useTradingStellarActivateToken } from '../../hooks/general/useTradingStellarActivateToken';

export type ConfirmationProps = {
    enteringAnimation?: AnimatedProps<any>['entering'];
};

type ContinueButtonProps = {
    selectQuote: () => Promise<void>;
};

const CONFIRMATION_TEST_ID = '@trading/buy/continue-button';

const ContinueButton = ({ selectQuote }: ContinueButtonProps) => (
    <AnimatedBox entering={FadeIn}>
        <Button onPress={selectQuote} testID={CONFIRMATION_TEST_ID}>
            <Translation id="moduleTrading.tradingScreen.buttons.continue" />
        </Button>
    </AnimatedBox>
);

export const BuyConfirmation = ({ enteringAnimation }: ConfirmationProps) => {
    const form = useBuyFormContext();
    const { canProceed, selectQuote } = useBuyFlow(form);
    const [receiveCryptoId, quote] = useWatch({
        control: form.control,
        name: ['asset.cryptoId', 'quote'],
    });

    const { isReceivingInactiveStellarToken, activateButtonElement } =
        useTradingStellarActivateToken({
            quote,
            receiveCryptoId,
            buttonTestId: CONFIRMATION_TEST_ID,
        });

    const shouldDisplayContinueButton = canProceed && !isReceivingInactiveStellarToken;

    return (
        <AnimatedBox entering={enteringAnimation} exiting={FadeOutDown}>
            {isReceivingInactiveStellarToken && activateButtonElement}
            {shouldDisplayContinueButton && <ContinueButton selectQuote={selectQuote} />}
        </AnimatedBox>
    );
};
