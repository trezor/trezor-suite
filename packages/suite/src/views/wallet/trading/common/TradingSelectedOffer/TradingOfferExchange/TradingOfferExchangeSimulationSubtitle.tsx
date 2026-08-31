import { Translation } from '@suite/intl';
import { useSelector } from '@suite-common/redux-utils';
import { isCrossChainTrade, selectTradingExchangeSelectedQuote } from '@suite-common/trading';
import { Icon, Row, Spinner, Text } from '@trezor/components';
import { ShieldCheckIcon } from '@trezor/icons';
const ICON_SIZE = 16;
const SIMULATION_PROVIDER = 'Blockaid';

type TradingOfferExchangeSimulationSubtitleProps = {
    isSimulationEnabled: boolean;
    isSimulationLoading: boolean;
    hasSimulationError: boolean;
};

export const TradingOfferExchangeSimulationSubtitle = ({
    isSimulationEnabled,
    isSimulationLoading,
    hasSimulationError,
}: TradingOfferExchangeSimulationSubtitleProps) => {
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);

    // A cross-chain swap is simulated on the source chain only, so the result says nothing
    // about what arrives — we still run it, but do not credit Blockaid for it.
    const isCrossChain = isCrossChainTrade(selectedQuote?.send, selectedQuote?.receive);

    if (!isSimulationEnabled || hasSimulationError || isCrossChain) {
        return null;
    }

    return (
        <Text
            as="div"
            intent="neutral"
            priority="secondary"
            typographyStyle="body-sm"
            data-testid="@trading/offer/simulation-subtitle"
        >
            <Row gap={4} alignItems="center">
                {isSimulationLoading ? (
                    <>
                        <Spinner size={ICON_SIZE} isDisabled />
                        <Translation id="TR_TRADING_SIMULATING" />
                    </>
                ) : (
                    <>
                        <Icon as={ShieldCheckIcon} size={ICON_SIZE} />
                        <Translation
                            id="TR_SIMULATION_POWERED_BY"
                            values={{ provider: SIMULATION_PROVIDER }}
                        />
                    </>
                )}
            </Row>
        </Text>
    );
};
