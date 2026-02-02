// Minimal icon set for connect-explorer build
// This file is type-checked against the full icon set to avoid typos.

import type { IconName as FullIconName } from '@suite-common/icons/src/icons-types';

export const requiredIconNames = [
    'plus',
    'x',
    'check',
    'xCircle',
    'question',
    'caretDown',
    'bookOpenText',
    'book',
    'lightning',
    'newspaper',
    'arrowLineUpRight',
    'githubLogoAlt',
    'arrowRight',
    'caretCircleDown',
] as const satisfies readonly FullIconName[];

export type IconName = (typeof requiredIconNames)[number];

// you might be tempted to build this dynamically based on requiredIconNames but this is not possible
// webpack won't be able to statically analyze it and it would end up in importing everything again.
export const icons = {
    plus: require('../../../../suite-common/icons/assets/plus.svg'),
    x: require('../../../../suite-common/icons/assets/x.svg'),
    check: require('../../../../suite-common/icons/assets/check.svg'),
    xCircle: require('../../../../suite-common/icons/assets/xCircle.svg'),
    question: require('../../../../suite-common/icons/assets/question.svg'),
    caretDown: require('../../../../suite-common/icons/assets/caretDown.svg'),
    bookOpenText: require('../../../../suite-common/icons/assets/bookOpenText.svg'),
    book: require('../../../../suite-common/icons/assets/book.svg'),
    lightning: require('../../../../suite-common/icons/assets/lightning.svg'),
    newspaper: require('../../../../suite-common/icons/assets/newspaper.svg'),
    arrowLineUpRight: require('../../../../suite-common/icons/assets/arrowLineUpRight.svg'),
    githubLogoAlt: require('../../../../suite-common/icons/assets/githubLogoAlt.svg'),
    arrowRight: require('../../../../suite-common/icons/assets/arrowRight.svg'),
    caretCircleDown: require('../../../../suite-common/icons/assets/caretCircleDown.svg'),
} satisfies Record<IconName, string>;
