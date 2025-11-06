import styled from 'styled-components';

import { FLAGS } from './flags';
import { resolveStaticPath } from '../../utils/resolveStaticPath';
import { IMAGES_PATH } from '../Image/Image';

export type FlagType = keyof typeof FLAGS;

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

export interface FlagProps {
    className?: string;
    country: FlagType;
    size?: number;
}

export const Flag = ({ size = 24, country }: FlagProps) => (
    <Wrapper>
        <img
            src={resolveStaticPath(`${IMAGES_PATH}/flags/${country.toLowerCase()}.svg`)}
            width={`${size}px`}
            alt={`flag-${country}`}
        />
    </Wrapper>
);
