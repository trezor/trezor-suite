// import original module declarations
import 'styled-components';
import { SuiteThemeColors } from './src/support/types';

declare module 'styled-components' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface DefaultTheme extends SuiteThemeColors {}
}

declare module '*.png' {
    const value: any;
    export = value;
}
