import React, { CSSProperties } from 'react';
import styled from 'styled-components';
import colors from '@suite/config/onboarding/colors';
import * as BREAKPOINTS from '@suite/config/onboarding/breakpoints';

const OptionWrapper = styled.div<{ isSelected: boolean }>`
    flex-grow: 1;
    width: 100%;
    padding: 10px;
    margin: 7px;
    border: solid 0.2px ${colors.gray};
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    box-shadow: ${({ isSelected }) =>
        isSelected ? `0px 0px 2px 1px ${colors.brandPrimary}` : '0px 0px 6px 2px rgba(0,0,0,0.05)'};
    bordercolor: ${({ isSelected }) => (isSelected ? `${colors.brandPrimary}` : `${colors.gray}`)}
        @media (min-width: ${BREAKPOINTS.SM}px) {
        height: 200px;
    }
`;

const Circle = styled.div`
    background-color: ${colors.brandPrimary};
    border-radius: 50%;
    height: 20px;
    width: 20px;
    align-self: flex-end;
`;

interface Props {
    onClick?: () => void;
    isSelected?: boolean;
    style?: CSSProperties;
    content: React.ReactNode;
}
const Option = (props: Props) => (
    <OptionWrapper
        // {...props}
        isSelected={props.isSelected}
        onClick={props.onClick}
    >
        <Circle style={{ visibility: props.isSelected ? 'visible' : 'hidden' }} />
        {props.content}
    </OptionWrapper>
);

export default Option;
