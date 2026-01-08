import { intlDecorator } from './intlDecorator';
import { themeDecorator } from './themeDecorator';

export const SHARED_DECORATORS = [intlDecorator, themeDecorator] as const;
