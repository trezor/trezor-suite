import { Translation } from '@suite/intl';
import { InfoItem, Text, Tooltip } from '@trezor/components';

type TradingExchangeRateInfoItemProps = {
    rateType: 'fixed' | 'floating';
};

export const TradingExchangeRateInfoItem = ({ rateType }: TradingExchangeRateInfoItemProps) => (
    <InfoItem label={<Translation id="TR_TRADING_RATE" />} direction="row">
        <Text typographyStyle="body-sm" data-testid="@trading/offer/info/exchange-type">
            <Tooltip
                content={
                    <Translation
                        id={
                            rateType === 'fixed'
                                ? 'TR_EXCHANGE_FIXED_OFFERS_INFO'
                                : 'TR_EXCHANGE_FLOAT_OFFERS_INFO'
                        }
                    />
                }
                hasIcon
            >
                <Translation
                    id={rateType === 'fixed' ? 'TR_EXCHANGE_FIXED' : 'TR_EXCHANGE_FLOAT'}
                />
            </Tooltip>
        </Text>
    </InfoItem>
);
