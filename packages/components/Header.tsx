import React from 'react';
import { View } from 'react-native';
import HeaderButton from './HeaderButton';

interface Props {
    onClick: (url: string) => void;
}

export const Header = ({ onClick }: Props) => (
    <View>
        <HeaderButton title="Home" onClick={() => onClick('/')} />
        <HeaderButton title="Wallet" onClick={() => onClick('/wallet')} />
        <HeaderButton title="Wallet/send#/1" onClick={() => onClick('/wallet/send#/1')} />
        <HeaderButton title="Wallet/send#/2" onClick={() => onClick('/wallet/send#/2')} />
    </View>
);
