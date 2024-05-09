// import original module declarations
import 'styled-components';
import { BoxShadows, Colors } from '@trezor/theme';
import { SuiteThemeColors } from '@trezor/components';

declare module 'styled-components' {
    export interface DefaultTheme extends SuiteThemeColors, Colors, BoxShadows {}
}
