import React from 'react';
import styled, { css } from 'styled-components';
import { variables, colors } from '@trezor/components';

const AddrWrapper = styled.div<Pick<Props, 'readOnly' | 'isSelected'>>`
    display: flex;
    width: 100%;
    align-items: center;
    border-top: 1px solid #ccc;
    padding: 8px 16px;
    cursor: pointer;

    &:last-child {
        border-bottom: 1px solid #ccc;
    }

    &:hover {
        background: #fafafa;
    }

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

const Overlay = styled.div<Pick<Props, 'isPartiallyHidden'>>`
    ${props =>
        props.isPartiallyHidden &&
        css`
            /* bottom: 0; */
            /* border: 1px solid ${colors.DIVIDER};
            border-radius: 2px; */
            position: absolute;
            width: 100%;
            height: 100%;
            background: linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(242, 242, 242, 1) 220px);
        `}
`;

interface Props extends React.HTMLProps<HTMLDivElement> {
    address: string;
    index: string | number;
    isSelected: boolean;
    readOnly?: boolean;
    isPartiallyHidden?: boolean;
    actions: React.ReactNode;
    secondaryText: React.ReactNode;
    className?: string;
}

const AddressItem = React.forwardRef((props: Props, ref: React.Ref<HTMLDivElement> | null) => {
    return (
        <AddrWrapper
            onClick={props.onClick}
            isSelected={props.isSelected}
            readOnly={props.readOnly}
            className={props.className}
        >
            <Index>{`/${props.index}`}</Index>
            <DescriptorWrapper>
                <Overlay isPartiallyHidden={props.isPartiallyHidden} />
                <Descriptor ref={ref}>{props.address}</Descriptor>
                <SmallText>{props.secondaryText}</SmallText>
            </DescriptorWrapper>
            <ActionsWrapper>{props.actions}</ActionsWrapper>
        </AddrWrapper>
    );
});

export default AddressItem;
