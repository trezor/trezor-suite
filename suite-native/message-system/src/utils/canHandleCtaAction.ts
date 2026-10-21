import { type CTAAction } from '@suite-common/suite-types';

export const canHandleCtaAction = (action?: CTAAction) => action === 'external-link';
