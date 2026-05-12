import { Translation, type TranslationKey } from '@suite/intl';
import { Button } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

interface TradingFormOfferConfirmButtonProps {
    onClick: () => void;
    isDisabled: boolean;
    isLoading: boolean;
    translationId: TranslationKey;
    testId: string;
}

export const TradingFormOfferConfirmButton = ({
    onClick,
    isDisabled,
    isLoading,
    translationId,
    testId,
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
            data-testid={testId}
            minWidth={160}
            width={isContentBelowBreakpoint ? undefined : '100%'}
        >
            <Translation id={translationId} />
        </Button>
    );
};
