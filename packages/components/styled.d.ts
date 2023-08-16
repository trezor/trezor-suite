// import original module declarations
import 'styled-components';
import { Colors } from '@trezor/theme';
import { SuiteThemeColors } from './src/support/types';

declare module 'styled-components' {
    export interface DefaultTheme extends SuiteThemeColors, Colors {}
}
