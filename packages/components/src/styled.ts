import 'styled-components';

import { type BoxShadows, type Colors, type ThemeVariant } from '@trezor/theme';

import { type SuiteThemeColors } from './config/colors';

declare module 'styled-components' {
    export interface DefaultTheme extends SuiteThemeColors, Colors, BoxShadows {
        variant: ThemeVariant;
    }
}
