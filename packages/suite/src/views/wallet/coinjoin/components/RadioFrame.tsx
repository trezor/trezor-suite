import React from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import type { TranslationKey } from '@suite-components/Translation/components/BaseTranslation';
import { RadioButton, variables } from '@trezor/components';

const PADDING = '16px';

const Heading = styled.div`
    font-size: ${variables.FONT_SIZE.H3};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Wrapper = styled.div<{ isSelected: boolean }>`
    background: ${({ theme }) => theme.BG_LIGHT_GREY};
    border: ${({ theme }) => `1px solid ${theme.STROKE_GREY}`};
    border-radius: 8px;
    box-shadow: ${({ isSelected, theme }) => isSelected && `0 0 0 2px ${theme.TYPE_GREEN}`};
    cursor: pointer;
    flex-basis: 50%;
    padding: ${PADDING};

    ${Heading} {
        color: ${({ isSelected, theme }) => isSelected && theme.TYPE_GREEN};
    }
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Subheading = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-top: 4px;
`;

const Separator = styled.hr`
    border: none;
    background: ${({ theme }) => theme.STROKE_GREY};
    height: 1px;
    margin: 16px -${PADDING};
`;

interface RadioFrameProps {
    children: React.ReactNode;
    heading: TranslationKey;
    isSelected: boolean;
    onClick: () => void;
    subheading: TranslationKey;
}

export const RadioFrame = ({
    children,
    heading,
    isSelected,
    onClick,
    subheading,
}: RadioFrameProps) => (
    <Wrapper isSelected={isSelected} onClick={onClick}>
        <Row>
            <Heading>
                <Translation id={heading} />
            </Heading>
            <RadioButton isChecked={isSelected} onClick={onClick} />
        </Row>
        <Subheading>
            <Translation id={subheading} />
        </Subheading>
        <Separator />
        {children}
    </Wrapper>
);
