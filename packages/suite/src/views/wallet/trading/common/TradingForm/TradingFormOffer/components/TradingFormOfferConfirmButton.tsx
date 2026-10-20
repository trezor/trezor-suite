import { Translation, type TranslationKey } from '@suite/intl';
import { Button, type IconComponent } from '@trezor/components';

interface TradingFormOfferConfirmButtonProps {
    onClick: () => void;
    translationId: TranslationKey;
    translationValues?: Record<string, string>;
    iconRight?: IconComponent;
    testId: string;
}

export const TradingFormOfferConfirmButton = ({
    onClick,
    translationId,
    translationValues,
    iconRight,
    testId,
}: TradingFormOfferConfirmButtonProps) => (
    <Button
        onClick={onClick}
        intent="brand"
        size="large"
        data-testid={testId}
        width="100%"
        iconRight={iconRight}
    >
        <Translation id={translationId} values={translationValues} />
    </Button>
);
