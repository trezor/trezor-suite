import { View } from 'react-native';

import { Image } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const NFC_TAG_SIZE = 80;

interface NfcTagProps {
    active?: boolean;
    testID?: string;
}

const tagStyle = prepareNativeStyle(utils => ({
    width: NFC_TAG_SIZE,
    height: NFC_TAG_SIZE,
    borderRadius: NFC_TAG_SIZE / 2,
    borderWidth: 2,
    borderColor: utils.colors.borderNeutral,
    overflow: 'hidden',
}));

export const NfcTag = ({ active = false, testID }: NfcTagProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View testID={testID} style={[applyStyle(tagStyle), { opacity: active ? 1 : 0.4 }]}>
            <Image
                source={require('./assets/nfc-tag.png')}
                width={NFC_TAG_SIZE}
                height={NFC_TAG_SIZE}
            />
        </View>
    );
};
