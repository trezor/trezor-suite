import { Translation } from '@suite/intl';
import { type TradingTradeType } from '@suite-common/trading';
import { Box, Modal } from '@trezor/components';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { isTradingExchangeContext } from 'src/utils/wallet/trading/tradingTypingUtils';

import { TradingOffersModalExchange } from './TradingOffersModalExchange';
import { TradingOffersModalGroup } from './TradingOffersModalGroup';

type TradingOffersModalProps = {
    onClose: () => void;
    onSelect: (quote: TradingTradeType) => void;
};

export const TradingOffersModal = ({ onClose, onSelect }: TradingOffersModalProps) => {
    const context = useTradingFormContext();

    // Invity API can return multiple quotes per exchange for the same payment method,
    // so deduplication by exchange is safe — each exchange only offers one rate at a time.
    const deduplicatedQuotes = context.quotes
        ? [...new Map(context.quotes.map(quote => [quote.exchange, quote])).values()]
        : [];

    const handleSelect = (quote: TradingTradeType) => {
        onSelect(quote);
        onClose();
    };

    return (
        <Modal
            onCancel={onClose}
            isBackdropCancelable
            heading={<Translation id="TR_TRADING_SHOW_OFFERS" />}
            data-testid="@trading/offers/modal"
            width={600}
            height={680}
        >
            <Box padding={{ bottom: 16 }}>
                {isTradingExchangeContext(context) ? (
                    <TradingOffersModalExchange onSelect={handleSelect} />
                ) : (
                    <TradingOffersModalGroup quotes={deduplicatedQuotes} onSelect={handleSelect} />
                )}
            </Box>
        </Modal>
    );
};
