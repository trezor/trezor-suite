import { type NetworkSymbol } from '@suite-common/networks';
import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type TextProps } from '@suite-native/atoms';

import { type FormatterProps } from '../types';

type NetworkDisplaySymbolNameFormatterProps = FormatterProps<NetworkSymbol> & TextProps;

export const NetworkDisplaySymbolNameFormatter = ({
    value,
}: NetworkDisplaySymbolNameFormatterProps) => getNetworkDisplaySymbolName(value);
