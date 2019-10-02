import React from 'react';
import styled, { css } from 'styled-components';
import { variables, colors } from '@trezor/components';

const INPUT_HOVER = '#F9F9F9';

const AddrWrapper = styled.div<Pick<Props, 'readOnly' | 'isSelected' | 'isVerifying'>>`
    display: flex;
    position: relative; /* needed for the tooltipAction */
    width: 100%;
    align-items: center;
    border: 1px solid ${colors.INPUT_BORDER};
    border-radius: 3px;
    padding: 0px 16px;
    height: 48px;
    cursor: pointer;

    & + & {
        margin-top: 5px;
    }

    ${props =>
        props.isSelected &&
        css`
            background: ${INPUT_HOVER};
        `};

    ${props =>
        props.isVerifying &&
        props.isSelected &&
        css`
            z-index: 10001; /* needed for the tooltipAction that activates modal overlay */
        `};

    ${props =>
        props.readOnly &&
        css`
            background: ${colors.GRAY_LIGHT};

            &:hover {
                background: ${colors.GRAY_LIGHT};
            }
        `};
`;

const DescriptorWrapper = styled.div`
    display: flex;
    flex: 0 1 auto;
    justify-items: center;
    flex-direction: column;
    margin-right: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    position: relative;
`;

const ActionsWrapper = styled.div`
    display: flex;
    flex: 0 0 0;
    align-items: center;
    justify-content: flex-end;
    margin-left: auto;
`;

const Index = styled.div`
    flex: 0;
    margin-right: 16px;
    justify-content: center;
    color: ${colors.TEXT_SECONDARY};
    font-size: ${variables.FONT_SIZE.BIG};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    /* align-self: baseline; */
`;

const Descriptor = styled.div`
    color: ${colors.TEXT_PRIMARY};
    font-size: ${variables.FONT_SIZE.BASE};
    font-family: ${variables.FONT_FAMILY.MONOSPACE};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    /* margin-bottom: 4px; */
`;

const SmallText = styled.span`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
`;

const Overlay = styled.div<Pick<Props, 'isPartiallyHidden' | 'readOnly' | 'isSelected'>>`
    ${props =>
        props.isPartiallyHidden &&
        css`
            /* bottom: 0; */
            /* border: 1px solid ${colors.DIVIDER};
            border-radius: 2px; */
            position: absolute;
            width: 100%;
            height: 100%;
            background: linear-gradient(to right, transparent, ${colors.WHITE} 75%);

            ${props.readOnly &&
                css`
                    background: linear-gradient(to right, transparent, rgba(242, 242, 242, 1) 75%);
                `};

            ${props.isSelected &&
                !props.readOnly &&
                css`
                    background: linear-gradient(to right, transparent, ${colors.SELECT_HOVER} 75%);
                `};
        `}
`;

const ArrowUp = styled.div`
    position: absolute;
    top: -9px;
    left: 12px;
    width: 0;
    height: 0;
    border-left: 9px solid transparent;
    border-right: 9px solid transparent;
    border-bottom: 9px solid black;
    z-index: 10002;
`;

const TooltipAction = styled.div`
    display: flex;
    align-items: center;
    height: 37px;
    margin: 0px 10px;
    padding: 0 14px;
    position: absolute;
    top: 45px;
    background: black;
    color: ${colors.WHITE};
    border-radius: 5px;
    line-height: ${variables.LINE_HEIGHT.TREZOR_ACTION};
    z-index: 10002;
`;

interface Props extends React.HTMLProps<HTMLDivElement> {
    address: string;
    index: string | number;
    isSelected: boolean;
    isVerifying?: boolean;
    readOnly?: boolean;
    isPartiallyHidden?: boolean;
    actions: React.ReactNode;
    secondaryText?: React.ReactNode;
    tooltipActions?: React.ReactNode;
    className?: string;
}

const AddressItem = React.forwardRef((props: Props, ref: React.Ref<HTMLDivElement>) => {
    return (
        <AddrWrapper
            onClick={props.onClick}
            isSelected={props.isSelected}
            isVerifying={props.isVerifying}
            readOnly={props.readOnly}
            className={props.className}
        >
            {props.tooltipActions && (
                <TooltipAction>
                    <ArrowUp />
                    {props.tooltipActions}
                </TooltipAction>
            )}
            <Index>{`/${props.index}`}</Index>
            <DescriptorWrapper>
                <Overlay
                    isPartiallyHidden={props.isPartiallyHidden}
                    isSelected={props.isSelected}
                    readOnly={props.readOnly}
                />
                <Descriptor ref={ref}>{props.address}</Descriptor>
                {props.secondaryText && <SmallText>{props.secondaryText}</SmallText>}
            </DescriptorWrapper>
            <ActionsWrapper>{props.actions}</ActionsWrapper>
        </AddrWrapper>
    );
});

export default AddressItem;
