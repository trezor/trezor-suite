import { type AnimatedProps, FadeIn, FadeOutDown } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { AnimatedBox, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useSellFormContext } from '../../hooks/sell/useSellFormContext';
import { useSellSelectQuote } from '../../hooks/sell/useSellSelectQuote';

export type ConfirmationProps = {
    enteringAnimation?: AnimatedProps<any>['entering'];
};

const CONFIRMATION_TEST_ID = '@trading/sell/continue-button';

export const SellConfirmation = ({ enteringAnimation }: ConfirmationProps) => {
    const form = useSellFormContext();
    const { canProceed, selectQuote } = useSellSelectQuote(form);

    const quote = form.watch('quote');
    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, quote?.exchange, 'sell'),
    );
    const providerName = providerInfo?.companyName ?? quote?.exchange ?? '';

    return (
        <AnimatedBox entering={enteringAnimation} exiting={FadeOutDown}>
            {canProceed && (
                <AnimatedBox entering={FadeIn}>
                    <Button
                        onPress={selectQuote}
                        testID={CONFIRMATION_TEST_ID}
                        iconRight="arrowSquareOut"
                    >
                        <Translation
                            id="moduleTrading.tradingScreen.buttons.sellVia"
                            values={{ providerName }}
                        />
                    </Button>
                </AnimatedBox>
            )}
        </AnimatedBox>
    );
};
