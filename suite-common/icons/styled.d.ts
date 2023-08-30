// import original module declarations
import 'styled-components';
import { Colors } from '@trezor/theme';

declare module 'styled-components' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface DefaultTheme extends Colors {}
}
