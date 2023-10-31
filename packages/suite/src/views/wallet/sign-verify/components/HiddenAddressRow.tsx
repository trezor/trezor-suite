import styled, { DefaultTheme } from 'styled-components';
import { variables } from '@trezor/components';
import type { AddressItem } from 'src/hooks/wallet/sign-verify/useSignAddressOptions';

type OverlayVariant = 'option' | 'option-focused' | 'input';

const getOverlayColor = ({ theme, variant }: { theme: DefaultTheme; variant: OverlayVariant }) => {
    if (variant === 'option-focused') return theme.BG_WHITE_ALT_HOVER;

    if (variant === 'option') return theme.BG_WHITE_ALT;

    return theme.BG_WHITE;
};

const Overlay = styled.div<{ variant: OverlayVariant }>`
    position: absolute;
    inset: 0;
    margin: -8px;
    border-radius: 3px;
    background-image: linear-gradient(to right, rgb(0 0 0 / 0%) 0%, ${getOverlayColor} 160px);
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
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 250px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface HiddenAddressRowProps {
    item: AddressItem;
    variant: OverlayVariant;
    className?: string;
}

export const HiddenAddressRow = ({ item, variant, className }: HiddenAddressRowProps) => (
    <Wrapper className={className}>
        <DerivationPathColumn>/{item.value.split('/').pop()}</DerivationPathColumn>

        <AddressColumn>
            <Overlay variant={variant} />
            {item.label}
        </AddressColumn>
    </Wrapper>
);
