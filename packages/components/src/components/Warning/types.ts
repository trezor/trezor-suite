import { UIVariant } from '../../config/types';

export type WarningVariant = Extract<
    UIVariant,
    'primary' | 'secondary' | 'info' | 'warning' | 'destructive' | 'tertiary'
>;
