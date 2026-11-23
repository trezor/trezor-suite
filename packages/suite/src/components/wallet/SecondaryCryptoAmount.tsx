import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Text } from '@trezor/components';

import { AmountUnitSwitchWrapper } from '#src/components/suite/AmountUnitSwitchWrapper';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';

type SecondaryCryptoAmountProps = {
    symbol: NetworkSymbol;
    value: string;
    'data-testid'?: string;
};

export const SecondaryCryptoAmount = ({
    symbol,
    value,
    'data-testid': dataTestId,
}: SecondaryCryptoAmountProps) => (
    <AmountUnitSwitchWrapper symbol={symbol}>
        <Text intent="neutral" typographyStyle="body-md" priority="secondary" as="div">
            <FormattedCryptoAmount data-testid={dataTestId} value={value} networkSymbol={symbol} />
        </Text>
    </AmountUnitSwitchWrapper>
);
