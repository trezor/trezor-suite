import React from 'react';
import styled from 'styled-components';

import * as BREAKPOINT from '@suite/config/onboarding/breakpoints';

import Option from './Option';

const OptionsWrapper = styled.div<{ count: number }>`
    display: flex;
    justify-content: space-around;
    flex-direction: column;
    width: 100%;

    @media (min-width: ${BREAKPOINT.SM}px) {
        width: ${props => props.count * 200};
        max-width: 120%;
        flex-direction: row;
    }
`;

interface Opt {
    [index: string]: any;
    key: number | string;
    content: React.ReactNode;
    // todo: types add generic instead of any
    value?: any;
    // todo: types - shoudl be onClick or onSelect in props.
    onClick?: () => void;
}

interface Props {
    selectedAccessor?: string;
    options: Opt[];
    // todo: types add generic instead of any
    onSelect?: (value: any) => void;
    // todo: types add generic
    selected: any;
}

const OptionsList = ({ selectedAccessor = 'value', ...props }: Props) => (
    <OptionsWrapper count={props.options.length}>
        {props.options.map((opt: Opt) => (
            <Option
                onClick={opt.onClick ? opt.onClick : () => props.onSelect(opt[selectedAccessor])}
                key={opt.key}
                content={opt.content}
                isSelected={opt[selectedAccessor] === props.selected}
            />
        ))}
    </OptionsWrapper>
);

export default OptionsList;
