import React from 'react';

import { resolveStaticPath } from '@suite-utils/nextjs';

interface Props {
    model: number;
}

export const InitImg = ({ model }: Props) => (
    <img alt="" src={resolveStaticPath(`images/svg/firmware-init-${model}.svg`)} />
);

export const SuccessImg = ({ model }: Props) => (
    <img alt="" src={resolveStaticPath(`images/svg/firmware-success-${model}.svg`)} />
);

// todo: ProgressImg. PRODUCT
