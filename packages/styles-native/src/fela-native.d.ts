declare module 'fela-native' {
    import type { IRenderer } from 'fela';

    export const createRenderer: () => IRenderer;
}
