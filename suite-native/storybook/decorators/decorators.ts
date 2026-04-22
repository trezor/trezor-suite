import { intlDecorator } from './intlDecorator';
import { layoutDecorator } from './layoutDecorator';
import { safeAreaDecorator } from './safeAreaDecorator';
import { themeDecorator } from './themeDecorator';

export const SHARED_DECORATORS = [
    layoutDecorator,
    intlDecorator,
    safeAreaDecorator,
    themeDecorator,
] as const;
