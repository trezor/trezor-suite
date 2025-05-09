import { ReactNode } from 'react';

import { HStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type TradeDetailInfoRowProps = {
    title: ReactNode;
    content: ReactNode;
    contentTestID?: string;
};

export const DETAIL_INFO_ROW_MIN_HEIGHT = 66;

const wrapperStyle = prepareNativeStyle(utils => ({
    justifyContent: 'space-between',
    minHeight: DETAIL_INFO_ROW_MIN_HEIGHT,
    alignItems: 'center',
    paddingHorizontal: utils.spacings.sp16,
}));

export const TradeDetailInfoRow = ({ title, content, contentTestID }: TradeDetailInfoRowProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack style={applyStyle(wrapperStyle)}>
            <Text variant="hint" color="textSubdued">
                {title}
            </Text>
            {typeof content === 'string' ? (
                <Text variant="hint" testID={contentTestID}>
                    {content}
                </Text>
            ) : (
                content
            )}
        </HStack>
    );
};
