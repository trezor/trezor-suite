import React from 'react';

import { Box, TileButton } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { sendReceiveContentType, SendReceiveContentType } from '../contentType';

const leftButtonStyle = prepareNativeStyle(() => ({
    marginRight: 3,
}));

const rightButtonStyle = prepareNativeStyle(() => ({
    marginLeft: 3,
}));

type AccountActionStepProps = {
    onChangeContentType: (type: SendReceiveContentType) => void;
};

export const AccountActionStep = ({ onChangeContentType }: AccountActionStepProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box flexDirection="row">
            <TileButton
                iconName="send"
                title="Send"
                onPress={() => {}}
                style={applyStyle(leftButtonStyle)}
                isDisabled
            />
            <TileButton
                iconName="receive"
                title="Receive"
                onPress={() => onChangeContentType(sendReceiveContentType.selectAccountToReceive)}
                style={applyStyle(rightButtonStyle)}
            />
        </Box>
    );
};
