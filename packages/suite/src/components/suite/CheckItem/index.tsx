import React from 'react';
import styled from 'styled-components';

import { Checkbox, variables } from '@trezor/components';

const { FONT_SIZE } = variables;

const StyledCheckbox = styled(Checkbox)`
    padding-left: 0px;
    margin: 12px 0px;
    align-items: flex-start;
    max-width: 80%;
`;

const CheckboxRight = styled.div`
    text-align: left;
`;

const CheckboxTitle = styled.div`
    margin-bottom: 8px;
`;

const CheckboxText = styled.div`
    font-size: ${FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

interface CheckItemProps {
    title: React.ReactNode;
    description: React.ReactNode;
    isChecked: boolean;
    link?: JSX.Element;
    onClick: () => void;
}

const CheckItem = ({ title, description, isChecked, link, onClick, ...rest }: CheckItemProps) => (
    <StyledCheckbox isChecked={isChecked} onClick={onClick} {...rest}>
        <CheckboxRight>
            <CheckboxTitle>{title}</CheckboxTitle>
            <CheckboxText>{description}</CheckboxText>
            {link && link}
        </CheckboxRight>
    </StyledCheckbox>
);

export default CheckItem;
