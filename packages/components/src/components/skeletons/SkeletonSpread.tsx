import styled from 'styled-components';
import { SkeletonStack, SkeletonStackProps } from './SkeletonStack';

export interface SkeletonSpreadProps extends SkeletonStackProps {
    spaceAround?: boolean;
}

export const SkeletonSpread = styled(SkeletonStack)<SkeletonSpreadProps>`
    justify-content: ${props => (props.spaceAround ? 'space-around' : 'space-between')};
`;
