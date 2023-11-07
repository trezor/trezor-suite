// import original module declarations
import 'styled-components';
import { SuiteThemeColors } from './src/support/types';

declare module 'styled-components' {
    export interface DefaultTheme extends SuiteThemeColors {}
}
