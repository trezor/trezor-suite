import { Translation } from '@suite/intl';
import { Button } from '@trezor/components';

interface TradingFormOfferContinueButtonProps {
    onClick: () => void;
    isDisabled: boolean;
    isLoading: boolean;
}

export const TradingFormOfferContinueButton = ({
    onClick,
    isDisabled,
    isLoading,
}: TradingFormOfferContinueButtonProps) => (
    <Button
        onClick={onClick}
        intent="brand"
        margin={{ top: 16 }}
        isDisabled={isDisabled}
        isLoading={isLoading}
        size="large"
        minWidth={160}
        width="100%"
    >
        <Translation id="TR_CONTINUE" />
    </Button>
);
