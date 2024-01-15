import styled, { css } from 'styled-components';

export interface SkeletonStackProps {
    col?: boolean;
    grow?: boolean;
    margin?: string;
    childMargin?: string;
    alignItems?: string;
}
export const SkeletonStack = styled.div<SkeletonStackProps>`
    display: flex;
    align-items: ${props => props.alignItems ?? 'auto'};
    flex-direction: ${props => (props.col ? 'column' : 'row')};
    flex-grow: ${props => (props.grow ? 1 : 0)};
    ${props =>
        props.margin &&
        css`
            margin: ${props.margin};
        `}
    ${props =>
        props.childMargin &&
        css`
            div {
                margin: ${props.childMargin};
            }
        `}
`;
