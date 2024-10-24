import { FormattedCryptoAmount } from 'src/components/suite';
import { Tooltip } from '@trezor/components';
import { BigNumber } from '@trezor/utils/src/bigNumber';

interface ApproximateInstantEthAmountProps {
    value: string | number;
    symbol: string;
}

const DEFAULT_MAX_DECIMAL_PLACES = 2;

export const ApproximateInstantEthAmount = ({
    value,
    symbol,
}: ApproximateInstantEthAmountProps) => {
    const hasDecimals = value.toString().includes('.');

    if (!hasDecimals) {
        return <FormattedCryptoAmount value={value} symbol={symbol} />;
    }

    const trimmedAmount = new BigNumber(value).toFixed(DEFAULT_MAX_DECIMAL_PLACES, 1);

    return (
        <Tooltip content={<FormattedCryptoAmount value={value} symbol={symbol} />}>
            <FormattedCryptoAmount value={trimmedAmount} symbol={symbol} />
        </Tooltip>
    );
};
