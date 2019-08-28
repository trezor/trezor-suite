import React from 'react';
import styled, { css } from 'styled-components';
import { Address } from 'trezor-connect';
import { variables, colors } from '@trezor/components';

const AddrWrapper = styled.div<{ isSelected: boolean }>`
    display: flex;
    width: 100%;
    align-items: center;
    border-top: 1px solid #ccc;
    padding: 8px 16px;
    cursor: pointer;

    &:last-child() {
        border-bottom: 1px solid #ccc;
    }

    &:hover {
        background: #fafafa;
    }

    ${props =>
        props.isSelected &&
        css`
            background: #eee;

            &:hover {
                background: #eee;
            }
        `};
`;

const PathWrapper = styled.div`
    display: flex;
    flex: 1;
    width: 100%;
    justify-items: center;
    flex-direction: column;
    margin-right: 10px;
`;

const ActionsWrapper = styled.div`
    display: flex;
    flex: 0;
    align-items: center;
`;

const Index = styled.div`
    flex: 0;
    margin-right: 16px;
    justify-content: center;
    color: ${colors.TEXT_SECONDARY};
    font-size: ${variables.FONT_SIZE.BIG};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    align-self: baseline;
`;

const Path = styled.div`
    color: ${colors.TEXT_PRIMARY};
    font-size: ${variables.FONT_SIZE.BASE};
    font-family: ${variables.FONT_FAMILY.MONOSPACE};
    margin-bottom: 4px;
`;

const SmallText = styled.span`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
`;

interface Props extends React.HTMLProps<HTMLDivElement> {
    addr: Address;
    index: number;
    isSelected: boolean;
    actions: React.ReactNode;
    secondaryText: React.ReactNode;
    className?: string;
}

const AddressItem = React.forwardRef((props: Props, ref: React.Ref<HTMLDivElement> | null) => {
    return (
        <AddrWrapper onClick={props.onClick} isSelected={props.isSelected}>
            <Index>{`/${props.index}`}</Index>
            <PathWrapper>
                <Path ref={ref}>{props.addr.address}</Path>
                <SmallText>{props.secondaryText}</SmallText>
            </PathWrapper>
            <ActionsWrapper>{props.actions}</ActionsWrapper>
        </AddrWrapper>
    );
});

export default AddressItem;
