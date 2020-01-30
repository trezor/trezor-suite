import React from 'react';
import { resolveStaticPath } from '@suite-utils/nextjs';

const InitImg = () => <img alt="" src={resolveStaticPath('images/firmware/firmware-init.svg')} />;

const SuccessImg = () => (
    <img alt="" src={resolveStaticPath('images/firmware/firmware-success.svg')} />
);

export { InitImg, SuccessImg };
