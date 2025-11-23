import styled from 'styled-components';

import { resolveStaticPath } from '@trezor/env-utils';

import { FLAGS } from './flags';
import { IMAGES_PATH } from '../Image/Image';

export type FlagType = keyof typeof FLAGS;

const Wrapper = styled.div<{ $isUnknown: boolean }>`
    display: flex;
    align-items: center;
    filter: ${({ $isUnknown, theme }) =>
        theme.variant === 'dark' && $isUnknown ? 'invert(1)' : 'none'};
`;

export interface FlagProps {
    className?: string;
    country: FlagType;
    size?: number;
}

export const Flag = ({ size = 24, country }: FlagProps) => {
    const isUnknown = country === 'UNKNOWN';

    return (
        <Wrapper $isUnknown={isUnknown}>
            <img
                src={resolveStaticPath(`${IMAGES_PATH}/flags/${country.toLowerCase()}.svg`)}
                width={`${size}px`}
                alt={`flag-${country}`}
            />
        </Wrapper>
    );
};
