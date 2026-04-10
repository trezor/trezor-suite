import { Translation, type TranslationKey } from '@suite/intl';
import { type TradingType } from '@suite-common/trading';
import { Button } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

interface TradingFormOfferConfirmButtonProps {
    type: TradingType;
    onClick: () => void;
    isDisabled: boolean;
    isLoading: boolean;
    translationId: TranslationKey;
}

export const TradingFormOfferConfirmButton = ({
    type,
    onClick,
    isDisabled,
    isLoading,
    translationId,
}: TradingFormOfferConfirmButtonProps) => {
    const isContentBelowBreakpoint = useIsContentBelowBreakpoint(breakpoints.tablet);

    return (
        <Button
            onClick={onClick}
            intent="brand"
            margin={{ top: 16 }}
            size="large"
            isDisabled={isDisabled}
            isLoading={isLoading}
            data-testid={`@trading/form/${type}-button`}
            minWidth={160}
            width={isContentBelowBreakpoint ? undefined : '100%'}
        >
            <Translation id={translationId} />
        </Button>
    );
};
