import { useSelector } from 'react-redux';

import {
    type AddressFormat,
    AddressFormatter as CommonAddressFormatter,
} from '@suite-common/formatters';
import { selectAddressDisplayType } from '@suite-common/wallet-core';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { Text, type TextProps } from '@suite-native/atoms';

import { type FormatterProps } from '../types';

type AddressFormatterProps = FormatterProps<string> & TextProps & { format: AddressFormat };

export const AddressFormatter = ({ value, format, ...textProps }: AddressFormatterProps) => {
    const addressDisplayType = useSelector(selectAddressDisplayType);
    const isChunked = addressDisplayType === AddressDisplayOptions.CHUNKED;

    return (
        <Text {...textProps}>
            <CommonAddressFormatter value={value} format={format} isChunked={isChunked} />
        </Text>
    );
};
