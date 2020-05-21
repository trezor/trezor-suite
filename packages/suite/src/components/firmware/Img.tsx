import React from 'react';

import { resolveStaticPath } from '@suite-utils/nextjs';

interface Props {
    model: number;
    height?: string;
}

export const InitImg = ({ model, ...props }: Props) => (
    <img alt="" src={resolveStaticPath(`images/svg/firmware-init-${model}.svg`)} {...props} />
);

export const SuccessImg = ({ model }: Props) => (
    <img alt="" src={resolveStaticPath(`images/svg/firmware-success-${model}.svg`)} />
);

// todo: ProgressImg. PRODUCT
