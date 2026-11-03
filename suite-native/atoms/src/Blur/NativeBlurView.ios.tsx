import { Host, RNHostView } from '@expo/ui/swift-ui';
import { blur } from '@expo/ui/swift-ui/modifiers';

import { Box } from '../Box';
import { type NativeBlurViewProps } from './NativeBlurViewTypes';

export const NativeBlurView = ({
    children,
    isBlurred,
    blurIntensity,
    ...props
}: NativeBlurViewProps) => {
    if (!isBlurred) {
        return <Box {...props}>{children}</Box>;
    }

    return (
        <Box {...props}>
            {/* Both hosts size their content natively; no JS layout callback or snapshot is needed. */}
            <Host matchContents ignoreSafeArea="all" modifiers={[blur(blurIntensity)]}>
                <RNHostView matchContents>
                    <Box>{children}</Box>
                </RNHostView>
            </Host>
        </Box>
    );
};
