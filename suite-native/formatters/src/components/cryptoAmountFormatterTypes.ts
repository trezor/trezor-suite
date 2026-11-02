import { type SignValue } from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TextProps } from '@suite-native/atoms';

import { type FormatterProps } from '../types';

export type CryptoAmountFormatterProps = FormatterProps<string | null | number> &
    TextProps & {
        symbol: NetworkSymbol;
        isBalance?: boolean;
        isDiscreetText?: boolean;
        isForcedDiscreetMode?: boolean;
        isLoading?: boolean;
        signValue?: SignValue;
    };
