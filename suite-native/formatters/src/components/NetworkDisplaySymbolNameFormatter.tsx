import { NetworkSymbol, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { TextProps } from '@suite-native/atoms';

import { FormatterProps } from '../types';

type NetworkDisplaySymbolNameFormatterProps = FormatterProps<NetworkSymbol> & TextProps;

export const NetworkDisplaySymbolNameFormatter = ({
    value,
}: NetworkDisplaySymbolNameFormatterProps) => getNetworkDisplaySymbolName(value);
