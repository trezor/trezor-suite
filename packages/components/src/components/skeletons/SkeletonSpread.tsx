import styled from 'styled-components';
import { SkeletonStack, SkeletonStackProps } from './SkeletonStack';

export interface SkeletonSpreadProps extends SkeletonStackProps {
    $spaceAround?: boolean;
}

// eslint-disable-next-line local-rules/no-override-ds-component
export const SkeletonSpread = styled(SkeletonStack)<SkeletonSpreadProps>`
    justify-content: ${props => (props.$spaceAround ? 'space-around' : 'space-between')};
`;
