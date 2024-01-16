import styled, { DefaultTheme } from 'styled-components';
import { useElevation, variables } from '@trezor/components';
import type { AddressItem } from 'src/hooks/wallet/sign-verify/useSignAddressOptions';
import { Elevation, mapElevationToBackground, nextElevation } from '@trezor/theme/src/elevation';

type OverlayVariant = 'option' | 'option-focused' | 'input';

const getOverlayColor = ({
    theme,
    variant,
    elevation,
}: {
    theme: DefaultTheme;
    variant: OverlayVariant;
    elevation: Elevation;
}) => {
    const map: Record<OverlayVariant, string> = {
        option: theme[mapElevationToBackground[elevation]],
        'option-focused': theme[mapElevationToBackground[nextElevation[elevation]]],
        input: theme[mapElevationToBackground[elevation]],
    };

    return map[variant];
};

const Overlay = styled.div<{ variant: OverlayVariant; elevation: Elevation }>`
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

export const HiddenAddressRow = ({ item, variant, className }: HiddenAddressRowProps) => {
    const { elevation } = useElevation();

    return (
        <Wrapper className={className}>
            <DerivationPathColumn>/{item.value.split('/').pop()}</DerivationPathColumn>

            <AddressColumn>
                <Overlay variant={variant} elevation={elevation} />
                {item.label}
            </AddressColumn>
        </Wrapper>
    );
};
