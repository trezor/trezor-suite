import { MouseEvent } from 'react';
import styled from 'styled-components';
import { Icon, variables } from '@trezor/components';
import { showAddress } from 'src/actions/wallet/signVerifyActions';
import { useDispatch } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { spacingsPx } from '@trezor/theme';

const RevealText = styled.div`
    max-width: 0;
    margin-right: 2px;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    white-space: nowrap;
    overflow: hidden;
    transition:
        max-width 0.2s ease-out,
        opacity 0.2s ease;
    opacity: 0;
`;

const ButtonWrapper = styled.button`
    position: absolute;
    top: -${spacingsPx.xxs};
    right: ${spacingsPx.xl};
    display: flex;
    align-items: center;
    margin-left: auto;
    padding: 2px 6px;
    border: none;
    border-radius: 4px;
    background-color: transparent;
    pointer-events: all;
    cursor: pointer;

    :hover {
        > ${RevealText} {
            max-width: 100px;
            opacity: 1;
        }
    }
`;

interface VerifyAddressButtonProps {
    item: { label: string; value: string };
}

export const VerifyAddressButton = ({ item: { label, value } }: VerifyAddressButtonProps) => {
    const dispatch = useDispatch();

    const reveal = (e: MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        dispatch(showAddress(label, value));
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
