import 'styled-components';
import { SuiteThemeColors, ThemeVariant } from '@trezor/components';
import { BoxShadows, Colors } from '@trezor/theme';


declare module 'styled-components' {
    export interface DefaultTheme extends SuiteThemeColors, Colors, BoxShadows {
        variant: ThemeVariant;
    }
}
