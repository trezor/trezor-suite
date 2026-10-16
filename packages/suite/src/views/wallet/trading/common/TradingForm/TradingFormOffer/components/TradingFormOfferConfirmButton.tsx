import { Translation, type TranslationKey } from '@suite-lego/intl';
import { Button, type IconComponent } from '@trezor/components';

interface TradingFormOfferConfirmButtonProps {
    onClick: () => void;
    isDisabled?: boolean;
    isLoading?: boolean;
    translationId: TranslationKey;
    translationValues?: Record<string, string>;
    iconRight?: IconComponent;
    testId: string;
}

export const TradingFormOfferConfirmButton = ({
    onClick,
    isDisabled,
    isLoading,
    translationId,
    translationValues,
    iconRight,
    testId,
}: TradingFormOfferConfirmButtonProps) => (
    <Button
        onClick={onClick}
        intent="brand"
        size="large"
        isDisabled={isDisabled}
        isLoading={isLoading}
        data-testid={testId}
        width="100%"
        iconRight={iconRight}
    >
        <Translation id={translationId} values={translationValues} />
    </Button>
);
