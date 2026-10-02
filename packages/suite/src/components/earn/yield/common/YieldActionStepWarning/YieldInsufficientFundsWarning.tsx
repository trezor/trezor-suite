import { Translation } from '@suite/intl';
import { Banner, Text } from '@trezor/components';

export function YieldInsufficientFundsWarning() {
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
}
