import React from 'react';
import styled from 'styled-components';

import { Checkbox, variables, colors } from '@trezor/components-v2';

const { FONT_SIZE } = variables;

const StyledCheckbox = styled(Checkbox)`
    margin-bottom: 22px;
`;

const CheckboxRight = styled.div`
    text-align: left;
`;

const CheckboxTitle = styled.div``;

const CheckboxText = styled.div`
    font-size: ${FONT_SIZE.TINY};
    color: ${colors.BLACK50};
    max-width: 360px;
`;

interface CheckItemProps {
    title: React.ReactNode;
    description: React.ReactNode;
    isChecked: boolean;
    onClick: () => void;
}

const CheckItem = ({ title, description, isChecked, onClick, ...rest }: CheckItemProps) => {
    return (
        <StyledCheckbox isChecked={isChecked} onClick={onClick} {...rest}>
            <CheckboxRight>
                <CheckboxTitle>{title}</CheckboxTitle>
                <CheckboxText>{description}</CheckboxText>
            </CheckboxRight>
        </StyledCheckbox>
    );
};

export default CheckItem;
