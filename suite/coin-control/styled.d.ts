import 'styled-components';
import { type SuiteThemeColors } from '@trezor/components';
import { type BoxShadows, type Colors, type ThemeVariant } from '@trezor/theme';

declare module 'styled-components' {
    export interface DefaultTheme extends SuiteThemeColors, Colors, BoxShadows {
        variant: ThemeVariant;
    }
}
