import type {
    TradingTradeType,
    TradingType,
    TradingUtilsProvidersProps,
} from '@suite-common/trading';
import { Card, Column, Paragraph, Row, Spinner } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';
import { TradingUtilsProvider } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsProvider';

import { TradingUtilsTorWarning } from '../TradingUtils/TradingUtilsTorWarning';

interface TradingFormOfferItemProps {
    bestQuote: TradingTradeType | undefined;
    isFormLoading: boolean;
    isFormInvalid: boolean;
    providers: TradingUtilsProvidersProps | undefined;
    isBestRate?: boolean;
    amountIsEmpty: boolean;
    tradingType: TradingType;
}

export const TradingFormOfferItem = ({
    bestQuote,
    isFormLoading,
    isFormInvalid,
    providers,
    amountIsEmpty,
    tradingType,
}: TradingFormOfferItemProps) => {
    const { isTorEnabled } = useSelector(selectTorState);
    const noOffersWithTor = isTorEnabled && !bestQuote && !isFormLoading && !isFormInvalid;

    if (!bestQuote || isFormLoading || isFormInvalid) {
        if (isFormLoading && !isFormInvalid) {
            return (
                <Card>
                    <Row
                        justifyContent="center"
                        margin={{ vertical: spacings.xs }}
                        gap={spacings.sm}
                        data-testid="@trading/offers/loading-spinner"
                    >
                        <Spinner size={32} isGrey={false} />
                        <Paragraph typographyStyle="hint" variant="tertiary">
                            <Translation id="TR_TRADING_OFFER_LOOKING" />
                        </Paragraph>
                    </Row>
                </Card>
            );
        }
        if (noOffersWithTor) {
            return (
                <TradingUtilsTorWarning tradingType={tradingType} noOffer={!bestQuote} showButton />
            );
        }

        return (
            <Card>
                <Paragraph
                    typographyStyle="hint"
                    variant="tertiary"
                    align="center"
                    margin={{ vertical: spacings.xs }}
                    data-testid="trading-offer-found-none"
                >
                    <Translation
                        id={
                            amountIsEmpty
                                ? 'TR_BUY_SELL_OFFERS_EMPTY'
                                : 'TR_TRADING_NO_OFFER_BUY_OR_SELL'
                        }
                    />
                </Paragraph>
            </Card>
        );
    }

    return (
        <Column gap={spacings.xs}>
            <Card>
                <TradingUtilsProvider providers={providers} exchange={bestQuote?.exchange} />
            </Card>

            <TradingUtilsTorWarning
                tradingType={tradingType}
                noOffer={!bestQuote}
                showButton={false}
            />
        </Column>
    );
};
