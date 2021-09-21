import React from 'react';
import styled, { DefaultTheme } from 'styled-components';
import { variables } from '@trezor/components';
import type { AddressItem } from '@wallet-hooks/sign-verify/useSignAddressOptions';

type OverlayVariant = 'option' | 'option-focused' | 'input';

const getOverlayColor = ({ theme, variant }: { theme: DefaultTheme; variant: OverlayVariant }) => {
    if (variant === 'option-focused') return theme.BG_WHITE_ALT_HOVER;
    if (variant === 'option') return theme.BG_WHITE_ALT;
    return theme.BG_WHITE;
};

const Overlay = styled.div<{ variant: OverlayVariant }>`
    bottom: 0;
    top: 0;
    left: 0;
    right: 0;
    border-radius: 3px;
    position: absolute;
    z-index: 1;
    margin: -8px;
    background-image: linear-gradient(to right, rgba(0, 0, 0, 0) 0%, ${getOverlayColor} 160px);
`;

const DerivationPathColumn = styled.div`
    min-width: 36px;
    padding-right: 12px;
    opacity: 0.4;
`;

const AddressColumn = styled.div`
    position: relative;
`;

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const HiddenAddressRow = ({
    item,
    variant,
    className,
}: {
    item?: AddressItem;
    variant: OverlayVariant;
    className?: string;
}) =>
    item ? (
        <Wrapper className={className}>
            <DerivationPathColumn>/{item.value.split('/').pop()}</DerivationPathColumn>
            <AddressColumn>
                <Overlay variant={variant} />
                {item.label}
            </AddressColumn>
        </Wrapper>
    ) : null;

export default HiddenAddressRow;
