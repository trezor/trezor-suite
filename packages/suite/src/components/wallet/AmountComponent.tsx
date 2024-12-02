import { isNftTokenTransfer, formatAmount, getTxOperation } from '@suite-common/wallet-utils';
import { TokenTransfer } from '@trezor/connect';
import { TypographyStyle } from '@trezor/theme';

import { FormattedNftAmount } from 'src/components/suite/FormattedNftAmount';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

type AmountComponentProps = {
    transfer: TokenTransfer;
    withLink?: boolean;
    withSign?: boolean;
    alignMultitoken?: 'flex-end' | 'flex-start';
    linkTypographyStyle?: TypographyStyle;
};

export const AmountComponent = ({
    transfer,
    withLink = false,
    withSign = false,
    alignMultitoken,
    linkTypographyStyle,
}: AmountComponentProps): React.ReactNode => {
    const operation = getTxOperation(transfer.type);

    if (isNftTokenTransfer(transfer)) {
        return (
            <FormattedNftAmount
                transfer={transfer}
                isWithLink={withLink}
                signValue={withSign ? operation : null}
                alignMultitoken={alignMultitoken}
                linkTypographyStyle={linkTypographyStyle}
            />
        );
    }

    if (withSign) {
        return (
            <FormattedCryptoAmount
                value={formatAmount(transfer.amount, transfer.decimals)}
                symbol={transfer.symbol}
                signValue={operation}
            />
        );
    }

    return formatAmount(transfer.amount, transfer.decimals);
};
