import React from 'react';
import { resolveStaticPath } from '@suite-utils/nextjs';

interface Props {
    model: number;
}

const InitImg = ({ model }: Props) => (
    <img alt="" src={resolveStaticPath(`images/firmware-init-${model}.svg`)} />
);

const SuccessImg = ({ model }: Props) => (
    <img alt="" src={resolveStaticPath(`images/firmware-success-${model}.svg`)} />
);

// todo: ProgressImg. PRODUCT

export { InitImg, SuccessImg };
