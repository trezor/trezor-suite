// import original module declarations
import 'styled-components';
import { types } from '@trezor/components';
import { Colors } from '@trezor/theme';

declare module 'styled-components' {
    export interface DefaultTheme extends types.SuiteThemeColors, Colors {}
}
