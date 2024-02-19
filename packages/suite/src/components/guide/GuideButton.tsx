import styled from 'styled-components';

import { Icon } from '@trezor/components';
import { zIndices } from '@trezor/theme';
import { useGuide } from 'src/hooks/guide';
import { FreeFocusInside } from 'react-focus-lock';

const Wrapper = styled.button<{ $isGuideOpen: boolean }>`
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
    border: solid 1px ${({ theme }) => theme.borderOnElevation1};
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    box-shadow: ${({ theme }) => theme.boxShadowBase};
    transition: opacity 0.3s ease 0.3s;
    opacity: ${({ $isGuideOpen }) => ($isGuideOpen ? 0 : 1)};

    :focus {
        transition: opacity 0.1s ease; /* hide button faster on guide open to prevent overlap */
    }

    > img {
        display: block;
    }
`;

export const GuideButton = () => {
    const { openGuide, isGuideOpen } = useGuide();

    return (
        <FreeFocusInside>
            <Wrapper
                data-test-id="@guide/button-open"
                onClick={openGuide}
                $isGuideOpen={isGuideOpen}
            >
                <Icon size={18} icon="LIGHTBULB" />
            </Wrapper>
        </FreeFocusInside>
    );
};
