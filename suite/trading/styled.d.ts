import 'styled-components';
import { SuiteThemeColors } from '@trezor/components';
import { BoxShadows, Colors, ThemeVariant } from '@trezor/theme';

declare module 'styled-components' {
    export interface DefaultTheme extends SuiteThemeColors, Colors, BoxShadows {
        variant: ThemeVariant;
    }
}
