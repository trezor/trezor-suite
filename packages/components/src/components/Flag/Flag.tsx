import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { FLAGS } from './flags';
import { SkeletonRectangle } from '../skeletons/SkeletonRectangle';

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

export const Flag = ({ size = 24, country, className }: FlagProps) => {
    const [src, setSrc] = useState('');
    useEffect(() => {
        import(`../../images/flags/${country.toLowerCase()}.svg`)
            .then(module => {
                setSrc(module.default);
            })
            .catch(err => {
                // NOTE: keep error here as this is not a critical issue
                console.error('Flag image loading error: ', err);
            });
    }, [country]);

    return (
        <Wrapper>
            {src ? (
                <img src={src} width={`${size}px`} alt={`flag-${country}`} className={className} />
            ) : (
                <SkeletonRectangle width={size} height={size} />
            )}
        </Wrapper>
    );
};
