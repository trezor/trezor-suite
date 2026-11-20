import { type SignValue } from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TextProps } from '@suite-native/atoms';

import { type DiscreetMode, type FormatterProps } from '../types';

export type CryptoAmountFormatterProps = FormatterProps<string | null | number> &
    TextProps & {
        symbol: NetworkSymbol;
        isBalance?: boolean;
        discreetMode?: DiscreetMode;
        isLoading?: boolean;
        signValue?: SignValue;
    };
