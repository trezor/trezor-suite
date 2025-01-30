import type { TradingTradeType } from '@suite-common/trading';
import { Card, Paragraph, Row, Spinner } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { TradingUtilsProvidersProps } from 'src/types/trading/trading';
import { TradingUtilsProvider } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsProvider';

interface TradingFormOfferItemProps {
    bestQuote: TradingTradeType | undefined;
    isFormLoading: boolean;
    isFormInvalid: boolean;
    providers: TradingUtilsProvidersProps | undefined;
    isBestRate?: boolean;
}

export const TradingFormOfferItem = ({
    bestQuote,
    isFormLoading,
    isFormInvalid,
    providers,
}: TradingFormOfferItemProps) => {
    if (!bestQuote || isFormLoading) {
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

        return (
            <Card>
                <Paragraph
                    typographyStyle="hint"
                    variant="tertiary"
                    align="center"
                    margin={{ vertical: spacings.xs }}
                >
                    <Translation id="TR_TRADING_OFFER_NO_FOUND" />
                    <br />
                    <Translation id="TR_TRADING_CHANGE_AMOUNT_OR_CURRENCY" />
                </Paragraph>
            </Card>
        );
    }

    return (
        <Card>
            <TradingUtilsProvider providers={providers} exchange={bestQuote?.exchange} />
        </Card>
    );
};
