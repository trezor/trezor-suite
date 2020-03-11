import React from 'react';
import styled from 'styled-components';

import { Checkbox, variables, colors } from '@trezor/components';

const { FONT_SIZE } = variables;

const StyledCheckbox = styled(Checkbox)`
    width: 400px;
    padding-left: 0px;
    margin: 24px auto;
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
    link?: JSX.Element;
    onClick: () => void;
}

const CheckItem = ({ title, description, isChecked, link, onClick, ...rest }: CheckItemProps) => {
    return (
        <StyledCheckbox isChecked={isChecked} onClick={onClick} {...rest}>
            <CheckboxRight>
                <CheckboxTitle>{title}</CheckboxTitle>
                <CheckboxText>{description}</CheckboxText>
                {link && link}
            </CheckboxRight>
        </StyledCheckbox>
    );
};

export default CheckItem;
