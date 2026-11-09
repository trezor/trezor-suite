import { Divider } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export const RECEIVE_ADDRESS_LIST_SEPARATOR_HEIGHT = 1;

const listSeparatorStyle = prepareNativeStyle(() => ({
    borderBottomWidth: RECEIVE_ADDRESS_LIST_SEPARATOR_HEIGHT,
}));

export const ReceiveAddressListSeparator = () => {
    const { applyStyle } = useNativeStyles();

    return <Divider marginHorizontal="sp16" style={applyStyle(listSeparatorStyle)} />;
};
