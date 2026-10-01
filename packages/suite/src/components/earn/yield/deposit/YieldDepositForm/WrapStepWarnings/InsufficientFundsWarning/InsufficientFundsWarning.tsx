import { Translation } from '@suite/intl';
import { Banner, Text } from '@trezor/components';

import { useIsInsufficientFundsWarningVisible } from './hooks/useIsInsufficientFundsWarningVisible';

export const InsufficientFundsWarning = () => {
    const isVisible = useIsInsufficientFundsWarningVisible();

    if (!isVisible) {
        return null;
    }

    return (
        <Banner
            intent="warning"
            data-testid="@yield/warning/insufficient-funds"
            description={
                <Text>
                    <Translation id="AMOUNT_IS_NOT_ENOUGH" />
                </Text>
            }
        />
    );
};
