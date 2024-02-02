import styled from 'styled-components';
import { GradientOverlay, useElevation } from '@trezor/components';
import type { AddressItem } from 'src/hooks/wallet/sign-verify/useSignAddressOptions';
import { borders, nextElevation, spacingsPx } from '@trezor/theme';

const StyledGradientOverlay = styled(GradientOverlay)`
    margin: -${spacingsPx.xs};
    border-radius: ${borders.radii.xxs};
`;

const DerivationPathColumn = styled.div`
    min-width: 36px;
    padding-right: ${spacingsPx.sm};
    opacity: 0.4;
`;

const AddressColumn = styled.div`
    position: relative;
    cursor: pointer;
`;

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 250px;
`;

interface HiddenAddressRowProps {
    item: AddressItem;
    isElevated?: boolean;
    className?: string;
}

export const HiddenAddressRow = ({
    item,
    isElevated = false,
    className,
}: HiddenAddressRowProps) => {
    const { elevation } = useElevation();

    const currentElevation = isElevated ? nextElevation[elevation] : elevation;

    return (
        <Wrapper className={`${className} react-select__single-value`}>
            <DerivationPathColumn>/{item.value.split('/').pop()}</DerivationPathColumn>

            <AddressColumn>
                <StyledGradientOverlay forcedElevation={currentElevation} hiddenFrom="160px" />
                {item.label}
            </AddressColumn>
        </Wrapper>
    );
};
