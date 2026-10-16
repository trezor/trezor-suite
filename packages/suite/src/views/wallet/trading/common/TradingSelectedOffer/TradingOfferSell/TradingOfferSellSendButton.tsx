import { Translation } from '@suite-lego/intl';
import { Button } from '@trezor/components';

type TradingOfferSellSendButtonProps = {
    isLoading: boolean;
    isDisabled: boolean;
    onClick: () => void;
};

export const TradingOfferSellSendButton = ({
    isLoading,
    isDisabled,
    onClick,
}: TradingOfferSellSendButtonProps) => (
    <Button
        data-testid="@trading/offer/confirm-on-trezor-and-send"
        isLoading={isLoading}
        isDisabled={isDisabled}
        onClick={onClick}
        size="large"
        width="100%"
    >
        <Translation id="TR_SELL_CONFIRM_ON_TREZOR_SEND" />
    </Button>
);
