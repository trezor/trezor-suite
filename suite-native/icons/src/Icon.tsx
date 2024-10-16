import { Text, StyleSheet } from 'react-native';

import codepoints from '@suite-common/icons/iconFonts/icons.json';

type IconName = keyof typeof codepoints;

type IconProps = {
    name: IconName;
};

const style = {
    fontFamily: 'IconFont',
    fontSize: 24,
    lineHeight: 24,
    color: 'red',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'grey',
};

export const Icon = ({ name }: IconProps) => {
    const char = String.fromCodePoint(codepoints[name]);

    return <Text style={style}>{char}</Text>;
};
