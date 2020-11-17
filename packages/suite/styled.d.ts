// import original module declarations
import 'styled-components';
import { types } from '@trezor/components';

declare module 'styled-components' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface DefaultTheme extends types.SuiteThemeColors {}
}
