// import original module declarations
import 'styled-components';
import { SuiteThemeColors } from '@trezor/components';
import { BoxShadows, Colors } from '@trezor/theme';

declare module 'styled-components' {
    export interface DefaultTheme extends SuiteThemeColors, Colors, BoxShadows {}
}
