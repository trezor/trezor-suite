import React from 'react';
import styled from 'styled-components';

import { resolveStaticPath } from '@suite-utils/nextjs';

const StyledImg = styled.img`
    flex: 1 0 auto;
`;
interface Props {
    model: number;
    height?: string;
}

export const InitImg = ({ model, ...props }: Props) => (
    <StyledImg alt="" src={resolveStaticPath(`images/svg/firmware-init-${model}.svg`)} {...props} />
);

export const SuccessImg = ({ model }: Props) => (
    <StyledImg alt="" src={resolveStaticPath(`images/svg/firmware-success-${model}.svg`)} />
);

// todo: ProgressImg. PRODUCT
