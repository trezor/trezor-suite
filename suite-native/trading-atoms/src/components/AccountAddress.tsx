import { Text, TextProps } from '@suite-native/atoms';

type AccountAddressProps = {
    address: string;
    form?: 'short' | 'full';
} & Omit<TextProps, 'numberOfLines' | 'children'>;

const SHORT_ADDRESS_TRUNCATION_LENGTH = 8;

export const AccountAddress = ({ address, form = 'full', ...textProps }: AccountAddressProps) => {
    const addressToDisplay =
        form === 'short' && address.length > SHORT_ADDRESS_TRUNCATION_LENGTH
            ? `${address.substring(0, SHORT_ADDRESS_TRUNCATION_LENGTH)}...`
            : address;

    return (
        <Text {...textProps} numberOfLines={1}>
            {addressToDisplay}
        </Text>
    );
};
