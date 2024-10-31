import { Row, Spinner, Card, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import {
    CoinmarketTradeDetailType,
    CoinmarketUtilsProvidersProps,
} from 'src/types/coinmarket/coinmarket';
import { CoinmarketUtilsProvider } from 'src/views/wallet/coinmarket/common/CoinmarketUtils/CoinmarketUtilsProvider';

interface CoinmarketFormOfferItemProps {
    bestQuote: CoinmarketTradeDetailType | undefined;
    isFormLoading: boolean;
    isFormInvalid: boolean;
    providers: CoinmarketUtilsProvidersProps | undefined;
    isBestRate?: boolean;
}

export const CoinmarketFormOfferItem = ({
    bestQuote,
    isFormLoading,
    isFormInvalid,
    providers,
}: CoinmarketFormOfferItemProps) => {
    if (!bestQuote || isFormLoading) {
        if (isFormLoading && !isFormInvalid) {
            return (
                <Card>
                    <Row
                        justifyContent="center"
                        margin={{ vertical: spacings.xs }}
                        gap={spacings.sm}
                    >
                        <Spinner size={32} isGrey={false} />
                        <Paragraph typographyStyle="hint" variant="tertiary">
                            <Translation id="TR_COINMARKET_OFFER_LOOKING" />
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
                    <Translation id="TR_COINMARKET_OFFER_NO_FOUND" />
                    <br />
                    <Translation id="TR_COINMARKET_CHANGE_AMOUNT_OR_CURRENCY" />
                </Paragraph>
            </Card>
        );
    }

    return (
        <Card>
            <CoinmarketUtilsProvider providers={providers} exchange={bestQuote?.exchange} />
        </Card>
    );
};
