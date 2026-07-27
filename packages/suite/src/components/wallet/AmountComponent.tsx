import {
    convertAmountSubunitsToUnits,
    getTxOperation,
    isNftTokenTransfer,
} from '@suite-common/wallet-utils';
import { type TokenTransfer } from '@trezor/connect';
import { type TypographyStyle } from '@trezor/theme';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { FormattedNftAmount } from 'src/components/suite/FormattedNftAmount';

type AmountComponentProps = {
    transfer: TokenTransfer;
    withLink?: boolean;
    withSign?: boolean;
    signGrayscale?: boolean;
    alignMultitoken?: 'flex-end' | 'flex-start';
    linkTypographyStyle?: TypographyStyle;
};

export const AmountComponent = ({
    transfer,
    withLink = false,
    withSign = false,
    signGrayscale,
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
                signGrayscale={signGrayscale}
                alignMultitoken={alignMultitoken}
                linkTypographyStyle={linkTypographyStyle}
            />
        );
    }

    if (withSign) {
        return (
            <FormattedCryptoAmount
                value={convertAmountSubunitsToUnits(transfer.amount, transfer.decimals)}
                symbol={transfer.symbol}
                contractAddress={transfer.contract}
                signValue={operation}
                signGrayscale={signGrayscale}
            />
        );
    }

    return convertAmountSubunitsToUnits(transfer.amount, transfer.decimals);
};
