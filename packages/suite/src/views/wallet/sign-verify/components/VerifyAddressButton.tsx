import React from 'react';
import styled from 'styled-components';
import { Icon, variables } from '@trezor/components';
import { showAddress as showAddressAction } from '@wallet-actions/signVerifyActions';
import { useActions } from '@suite-hooks';
import { Translation } from '@suite-components';

const RevealText = styled.div`
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    white-space: nowrap;
    overflow: hidden;
    margin-right: 2px;
    transition: max-width 0.3s;
    max-width: 0;
`;

const ButtonWrapper = styled.button`
    border: none;
    border-radius: 4px;
    margin-left: auto;
    display: flex;
    align-items: center;
    padding: 2px 6px;
    pointer-events: all;
    background-color: transparent;
    cursor: pointer;
    transition: background-color 0.3s;
    &:hover {
        background-color: ${props => props.theme.BG_WHITE_ALT_HOVER};
        & > div {
            max-width: 100px;
        }
    }
`;

const VerifyAddressButton = ({
    item: { label, value },
}: {
    item: { label: string; value: string };
}) => {
    const { showAddress } = useActions({
        showAddress: showAddressAction,
    });
    const reveal = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        showAddress(label, value);
    };
    return (
        <ButtonWrapper type="button" onMouseDown={e => e.stopPropagation()} onClick={reveal}>
            <RevealText>
                <Translation id="TR_REVEAL_ADDRESS" />
            </RevealText>
            <Icon size={20} icon="SHOW" />
        </ButtonWrapper>
    );
};

export default VerifyAddressButton;
