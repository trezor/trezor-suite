import { useMemo } from 'react';

import type { SellFiatTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import {
    isCountrySubdivisionEmpty,
    selectTradingComposedTransactionInfo,
    tradingSellActions,
} from '@suite-common/trading';
import { selectAreFeesLoading, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { isAmountTooHigh } from '@suite-common/wallet-utils';
import { Button, Column } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';
import {
    getCryptoQuoteAmountProps,
    getSelectedCryptoId,
    getSelectedQuote,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import {
    tradingGetAmountLabels,
    tradingGetSectionActionLabel,
} from 'src/utils/wallet/trading/tradingUtils';
import { TradingFormOfferOTC } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferOTC';
import { TradingUtilsTorWarning } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsTorWarning';

import { TradingFormOfferAmount } from '../common/TradingForm/TradingFormOffer/components/TradingFormOfferAmount/TradingFormOfferAmount';
import { TradingFormOfferWarnings } from '../common/TradingForm/TradingFormOffer/components/TradingFormOffersWarnings';

export const TradingFormSellOffer = () => {
    const dispatch = useDispatch();
    const { isTorEnabled } = useSelector(selectTorState);
    const context = useTradingFormContext<'sell'>();
    const {
        account,
        isAmountEmpty,
        watch,
        shouldSendInSats,
        sellInfo,
        selectQuote,
        form: { state },
    } = context;

    const areFeesLoading = useSelector(suiteState =>
        selectAreFeesLoading(suiteState, account.symbol),
    );
    const composedTransactionInfo = useSelector(selectTradingComposedTransactionInfo);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const { amountInCrypto, outputs } = watch();
    const { amount, token } = outputs[0];
    const tokenAddress = token as TokenAddress | null;
    const areSatsUsed = !!shouldSendInSats;

    const fee = composedTransactionInfo?.composed?.fee;
    const isFeeRequiredButMissingValue = fee === undefined || fee === '';

    const amountLabels = tradingGetAmountLabels({ type: 'sell', amountInCrypto });

    const quote = getSelectedQuote(context) as SellFiatTrade | undefined;
    const quoteAmounts = getCryptoQuoteAmountProps(quote, context);
    const selectedCryptoId = getSelectedCryptoId(context);

    const sendAmount =
        !state.isLoadingOrInvalid && quoteAmounts?.sendAmount ? quoteAmounts.sendAmount : '0';

    const { tradingDeviceDisconnected } = useTradingDeviceDisconnected();

    const isSubdivisionMissing = useMemo(() => {
        const { countrySelect, countrySubdivisionSelect } = watch();

        return isCountrySubdivisionEmpty(countrySelect?.value, countrySubdivisionSelect?.value);
    }, [watch]);

    const amountTooHigh = isAmountTooHigh({
        amount,
        contractAddress: tokenAddress,
        account,
        areSatsUsed,
    });

    const isButtonDisabled =
        isDiscoveryRunning ||
        tradingDeviceDisconnected ||
        state.isLoadingOrInvalid ||
        !quote ||
        amountTooHigh ||
        areFeesLoading ||
        isFeeRequiredButMissingValue;

    const isLoading = state.isFormLoading;

    const receiveCurrency = quoteAmounts?.receiveCurrency;
    const selectedAssetCryptoId =
        !state.isLoadingOrInvalid && receiveCurrency
            ? receiveCurrency
            : (selectedCryptoId ?? undefined);

    const isContentBelowBreakpoint = useIsContentBelowBreakpoint(breakpoints.tablet);
    const noOffersWithTor = isTorEnabled && !quote && !isLoading;
    const isConfirmButtonLoading = areFeesLoading || (state.isFormLoading && !isAmountEmpty);

    const confirmButtonTranslationId =
        state.isFormLoading && !isAmountEmpty
            ? 'TR_TRADING_OFFER_LOOKING'
            : tradingGetSectionActionLabel('sell');

    const onSelectQuote = () => {
        if (!quote) return;

        const provider = quote.exchange ? sellInfo?.providerInfos[quote.exchange] : undefined;

        if (provider?.flow === 'BANK_ACCOUNT') {
            dispatch(tradingSellActions.setFormStep('BANK_ACCOUNT'));
        } else {
            dispatch(tradingSellActions.setFormStep('SEND_TRANSACTION'));
        }

        selectQuote(quote);
    };

    return (
        <Column gap={20}>
            <TradingFormOfferAmount
                amount={quoteAmounts?.receiveAmount ?? '0'}
                sendAmount={sendAmount}
                selectedAssetCryptoId={selectedAssetCryptoId}
                shouldDisplayFiatAmount={!!amountInCrypto}
                amountLabels={amountLabels}
            />

            <TradingFormOfferWarnings
                isSubdivisionMissing={isSubdivisionMissing}
                hasQuote={!!quote}
            />

            {noOffersWithTor && <TradingUtilsTorWarning tradingType="sell" noOffer={!quote} />}

            <Button
                onClick={onSelectQuote}
                intent="brand"
                margin={{ top: 16 }}
                size="large"
                isDisabled={isButtonDisabled || isLoading}
                isLoading={isConfirmButtonLoading}
                data-testid="@trading/form/sell-button"
                minWidth={160}
                width={isContentBelowBreakpoint ? undefined : '100%'}
            >
                <Translation id={confirmButtonTranslationId} />
            </Button>

            <TradingFormOfferOTC />
        </Column>
    );
};
