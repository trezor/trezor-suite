import { bottomSheetDecorator } from './bottomSheetDecorator';
import { intlDecorator } from './intlDecorator';
import { layoutDecorator } from './layoutDecorator';
import { safeAreaDecorator } from './safeAreaDecorator';
import { themeDecorator } from './themeDecorator';

export const SHARED_DECORATORS = [
    layoutDecorator,
    bottomSheetDecorator,
    intlDecorator,
    safeAreaDecorator,
    themeDecorator,
] as const;
