import React from 'react';
import styled from 'styled-components';
import { Icon, variables } from '@trezor/components';
import { showAddress as showAddressAction } from 'src/actions/wallet/signVerifyActions';
import { useActions } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';

const RevealText = styled.div`
    max-width: 0;
    margin-right: 2px;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    white-space: nowrap;
    overflow: hidden;
    transition: max-width 0.3s;
`;

const ButtonWrapper = styled.button`
    position: absolute;
    right: 0px;
    display: flex;
    align-items: center;
    margin-left: auto;
    padding: 2px 6px;
    border: none;
    border-radius: 4px;
    background-color: transparent;
    transition: background-color 0.3s;
    pointer-events: all;
    cursor: pointer;

    :hover {
        background-color: ${props => props.theme.BG_WHITE_ALT_HOVER};

        > div {
            max-width: 100px;
        }
    }
`;

interface VerifyAddressButtonProps {
    item: { label: string; value: string };
}

export const VerifyAddressButton = ({ item: { label, value } }: VerifyAddressButtonProps) => {
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
