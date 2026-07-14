import { Translation } from '@suite/intl';
import { InfoItem, Text, Tooltip } from '@trezor/components';

export const TREZOR_FEE_PERCENTAGE = 2.3;

export const TradingTrezorFeeInfoItem = () => (
    <InfoItem
        label={
            <Tooltip content={<Translation id="TR_TRADING_TREZOR_FEE_TOOLTIP" />} hasIcon>
                <Translation id="TR_TRADING_TREZOR_FEE" />
            </Tooltip>
        }
        direction="row"
    >
        <Text typographyStyle="body-sm" data-testid="@trading/offer/info/trezor-fee">
            {`${TREZOR_FEE_PERCENTAGE}%`}
        </Text>
    </InfoItem>
);
