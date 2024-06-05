import styled from 'styled-components';

import { Icon, useElevation } from '@trezor/components';
import { Elevation, mapElevationToBackground, mapElevationToBorder, zIndices } from '@trezor/theme';
import { useGuide } from 'src/hooks/guide';
import { FreeFocusInside } from 'react-focus-lock';

const Wrapper = styled.button<{ $isGuideOpen: boolean; $elevation: Elevation }>`
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    z-index: ${zIndices.guideButton};
    bottom: 18px;
    right: 18px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    border: solid 1px ${mapElevationToBorder};
    background: ${mapElevationToBackground};
    box-shadow: ${({ theme, $elevation }) => ($elevation === 1 ? theme.boxShadowBase : undefined)};
    transition: opacity 0.3s ease 0.3s;
    opacity: ${({ $isGuideOpen }) => ($isGuideOpen ? 0 : 1)};

    &:focus {
        transition: opacity 0.1s ease; /* hide button faster on guide open to prevent overlap */
    }

    > img {
        display: block;
    }
`;

export const GuideButton = () => {
    const { openGuide, isGuideOpen } = useGuide();
    const { elevation } = useElevation();

    return (
        <FreeFocusInside>
            <Wrapper
                data-test="@guide/button-open"
                onClick={openGuide}
                $isGuideOpen={isGuideOpen}
                $elevation={elevation}
            >
                <Icon size={18} icon="LIGHTBULB" />
            </Wrapper>
        </FreeFocusInside>
    );
};
