import React from 'react';
import styled from 'styled-components';
import { Icon, colors, Tooltip } from '@trezor/components';
import { Translation } from '@suite-components';
import { ExtendedMessageDescriptor } from '@suite-types';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const Label = styled.div`
    margin-right: 4px;
`;

interface Props {
    label?: JSX.Element | ExtendedMessageDescriptor['id'];
    tooltip?: JSX.Element | ExtendedMessageDescriptor['id'];
    size?: number;
    className?: string;
    color?: string;
    // This is workaround for pixel-perfect alignment of the icon: see https://medium.com/microsoft-design/leading-trim-the-future-of-digital-typesetting-d082d84b202
    iconStyle?: React.SVGAttributes<HTMLDivElement>['style'];
}

export const QuestionTooltip = ({
    label,
    tooltip,
    className,
    size = 16,
    color = colors.NEUE_TYPE_LIGHT_GREY,
    iconStyle,
}: Props) => (
    <Wrapper className={className}>
        {label && <Label>{typeof label === 'string' ? <Translation id={label} /> : label}</Label>}
        {tooltip && (
            <Tooltip
                placement="top"
                content={typeof tooltip === 'string' ? <Translation id={tooltip} /> : tooltip}
            >
                <Icon
                    useCursorPointer
                    size={size}
                    color={color}
                    style={iconStyle}
                    icon="QUESTION"
                />
            </Tooltip>
        )}
    </Wrapper>
);

export default QuestionTooltip;
