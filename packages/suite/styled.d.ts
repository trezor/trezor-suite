// import original module declarations
import 'styled-components';
import { types } from '@trezor/components';

declare module 'styled-components' {
    export interface DefaultTheme extends types.SuiteThemeColors {}
}
