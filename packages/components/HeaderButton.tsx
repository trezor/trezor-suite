import React from 'react';
import { Button } from 'react-native';

interface Props {
    title: string;
    onClick: () => void;
}

const HeaderButton = (props: Props) => {
    return <Button onPress={props.onClick} title={props.title} />;
};

export default HeaderButton;
