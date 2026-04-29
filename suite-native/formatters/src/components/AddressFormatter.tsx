import {
    type AddressFormat,
    AddressFormatter as CommonAddressFormatter,
} from '@suite-common/formatters';
import { Text, type TextProps } from '@suite-native/atoms';

import { type FormatterProps } from '../types';

type AddressFormatterProps = FormatterProps<string> & TextProps & { format: AddressFormat };

export const AddressFormatter = ({ value, format, ...textProps }: AddressFormatterProps) => (
    <Text {...textProps}>
        <CommonAddressFormatter value={value} format={format} />
    </Text>
);
