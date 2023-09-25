import styled from 'styled-components';
import { useState, Ref, ReactNode, HTMLAttributes, TextareaHTMLAttributes } from 'react';

import { FONT_SIZE } from '../../../config/variables';
import { InputState } from '../../../support/types';
import {
    Label,
    LabelLeft,
    LabelRight,
    RightLabel,
    baseInputStyle,
    getInputStateTextColor,
    LabelAddon,
} from '../InputStyles';

const Wrapper = styled.div`
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
`;

const StyledTextarea = styled.textarea<Pick<TextareaProps, 'inputState' | 'width'>>`
    ${baseInputStyle}

    width: ${({ width }) => (width ? `${width}px` : '100%')};
    padding: 14px 16px;
    resize: none;
    white-space: pre-wrap;
`;

const CharacterCount = styled.div`
    position: absolute;
    bottom: 35px;
    right: 15px;
    font-size: ${FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const BottomText = styled.span<Pick<TextareaProps, 'inputState'>>`
    padding: 6px 10px 0 10px;
    min-height: 27px;
    font-size: ${FONT_SIZE.TINY};
    color: ${({ inputState, theme }) => getInputStateTextColor(inputState, theme)};
`;

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    isDisabled?: boolean;
    label?: ReactNode;
    labelAddon?: ReactNode;
    labelRight?: ReactNode;
    innerRef?: Ref<HTMLTextAreaElement>;
    bottomText?: ReactNode;
    width?: number;
    inputState?: InputState;
    maxRows?: number;
    wrapperProps?: HTMLAttributes<HTMLDivElement> & { 'data-test'?: string };
    noError?: boolean;
    value?: string;
    characterCount?: boolean | { current: number | undefined; max: number };
}

export const Textarea = ({
    className,
    value,
    maxLength,
    labelAddon,
    isDisabled,
    innerRef,
    label,
    inputState,
    bottomText,
    wrapperProps,
    width,
    rows = 5,
    labelRight,
    characterCount,
    children,
    ...rest
}: TextareaProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const getCharacterCount = () => {
        // controlled component
        if (characterCount === true && value !== undefined && maxLength !== undefined) {
            return `${value.length} / ${maxLength}`;
        }
        // uncontrolled component
        if (typeof characterCount === 'object') {
            return `${characterCount.current ?? 0} / ${characterCount.max}`;
        }
    };

    const formattedCharacterCount = getCharacterCount();
    const isWithLabel = label || labelAddon || labelRight;

    return (
        <Wrapper
            className={className}
            {...wrapperProps}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {isWithLabel && (
                <Label>
                    <LabelLeft>{label}</LabelLeft>
                    <LabelRight>
                        {labelAddon && <LabelAddon isVisible={isHovered}>{labelAddon}</LabelAddon>}
                        {labelRight && <RightLabel>{labelRight}</RightLabel>}
                    </LabelRight>
                </Label>
            )}

            <StyledTextarea
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                maxLength={maxLength}
                disabled={isDisabled}
                width={width}
                inputState={inputState}
                rows={rows}
                ref={innerRef}
                {...rest}
            />

            {formattedCharacterCount && <CharacterCount>{formattedCharacterCount}</CharacterCount>}

            {children}

            {bottomText && <BottomText inputState={inputState}>{bottomText}</BottomText>}
        </Wrapper>
    );
};
