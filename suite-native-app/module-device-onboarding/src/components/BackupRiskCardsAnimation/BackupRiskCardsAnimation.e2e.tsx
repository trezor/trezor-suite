import { View, useWindowDimensions } from 'react-native';

import { useNativeStyles } from '@trezor/styles-native';

import { animationStyle } from './BackupRiskCardsAnimation.styles';

// Marquee's continuous frame callbacks prevent Espresso from detecting idle UI,
// so E2E builds only reserve the layout space without mounting the animation.
export const BackupRiskCardsAnimation = () => {
    const { applyStyle } = useNativeStyles();
    const { width: animationWidth } = useWindowDimensions();

    return <View style={applyStyle(animationStyle, { animationWidth })} />;
};
