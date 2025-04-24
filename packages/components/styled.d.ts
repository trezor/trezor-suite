// import original module declarations
import 'styled-components';
import { BoxShadows, Colors } from '@trezor/theme';

import { SuiteThemeColors, ThemeVariant } from './src';

declare module 'styled-components' {
    export interface DefaultTheme extends SuiteThemeColors, Colors, BoxShadows {
        variant: ThemeVariant;
    }
}
