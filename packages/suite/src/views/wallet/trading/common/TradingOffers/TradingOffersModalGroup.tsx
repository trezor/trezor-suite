import { Translation, type TranslationKey } from '@suite/intl';
import { type TradingTradeType } from '@suite-common/trading';
import { CardList, Column, H3, Paragraph } from '@trezor/components';

import { TradingOffersModalItem } from './TradingOffersModalItem';

type TradingOffersModalGroupProps = {
    title?: TranslationKey;
    description?: TranslationKey;
    quotes: TradingTradeType[];
    onSelect: (quote: TradingTradeType) => void;
};
export const TradingOffersModalGroup = ({
    title,
    description,
    quotes,
    onSelect,
}: TradingOffersModalGroupProps) => (
    <Column gap={16}>
        {(title || description) && (
            <div>
                {title && (
                    <H3 typographyStyle="body-md-strong">
                        <Translation id={title} />
                    </H3>
                )}
                {description && (
                    <Paragraph typographyStyle="body-sm" color="contentSecondary">
                        <Translation id={description} />
                    </Paragraph>
                )}
            </div>
        )}
        <CardList>
            {quotes.map(quote => (
                <TradingOffersModalItem
                    key={quote.id ?? `quote-${quote.exchange}`}
                    quote={quote}
                    onSelect={onSelect}
                />
            ))}
        </CardList>
    </Column>
);
