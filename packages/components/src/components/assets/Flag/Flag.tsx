import styled from 'styled-components';
import { FLAGS } from './flags';

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

export const Flag = ({ size = 24, country, className }: FlagProps) => (
    <Wrapper>
        <img
            src={require(`../../../images/flags/${country.toLowerCase()}.svg`)}
            width={`${size}px`}
            alt={`flag-${country}`}
            className={className}
        />
    </Wrapper>
);
