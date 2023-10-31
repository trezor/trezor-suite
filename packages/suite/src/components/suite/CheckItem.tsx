import { ReactNode } from 'react';
import styled from 'styled-components';

import { Checkbox, variables } from '@trezor/components';

const { FONT_SIZE } = variables;

const StyledCheckbox = styled(Checkbox)`
    padding-left: 0;
    align-items: flex-start;

    & + & {
        margin-top: 16px;
    }
`;

const CheckboxRight = styled.div`
    text-align: left;
`;

const CheckboxTitle = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const CheckboxText = styled.div`
    font-size: ${FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

interface CheckItemProps {
    title: ReactNode;
    description?: ReactNode;
    isChecked: boolean;
    link?: JSX.Element;
    onClick: () => void;
}

export const CheckItem = ({
    title,
    description,
    isChecked,
    link,
    onClick,
    ...rest
}: CheckItemProps) => (
    <StyledCheckbox isChecked={isChecked} onClick={onClick} {...rest}>
        <CheckboxRight>
            <CheckboxTitle>{title}</CheckboxTitle>
            {description && <CheckboxText>{description}</CheckboxText>}
            {link && link}
        </CheckboxRight>
    </StyledCheckbox>
);
