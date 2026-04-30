import { type AnimatedProps, FadeOutDown } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { AnimatedBox, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useBuyFlow } from '../../hooks/buy/useBuyFlow';
import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useTradingStellarActivateToken } from '../../hooks/general/useTradingStellarActivateToken';

export type ConfirmationProps = {
    enteringAnimation?: AnimatedProps<any>['entering'];
};

const CONFIRMATION_TEST_ID = '@trading/buy/continue-button';

export const BuyConfirmation = ({ enteringAnimation }: ConfirmationProps) => {
    const form = useBuyFormContext();
    const receiveAsset = form.watch('asset');
    const receiveCryptoId = receiveAsset?.cryptoId;

    const { canProceed, selectQuote } = useBuyFlow(form);

    const quote = form.watch('quote');
    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, quote?.exchange, 'buy'),
    );
    const providerName = providerInfo?.companyName ?? quote?.exchange;

    const { isReceivingInactiveStellarToken, activateButtonElement } =
        useTradingStellarActivateToken({
            quote,
            receiveCryptoId,
            buttonTestId: CONFIRMATION_TEST_ID,
        });

    return isReceivingInactiveStellarToken
        ? activateButtonElement
        : canProceed && (
              <AnimatedBox entering={enteringAnimation} exiting={FadeOutDown}>
                  <Button
                      onPress={selectQuote}
                      testID={CONFIRMATION_TEST_ID}
                      iconRight="arrowSquareOut"
                  >
                      {providerName ? (
                          <Translation
                              id="moduleTrading.tradingScreen.buttons.buyVia"
                              values={{ providerName }}
                          />
                      ) : (
                          <Translation id="moduleTrading.tradingScreen.buttons.continue" />
                      )}
                  </Button>
              </AnimatedBox>
          );
};
