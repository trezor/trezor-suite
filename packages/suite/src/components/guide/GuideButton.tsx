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
    border: solid 1px ${({ theme }) => theme.STROKE_GREY_ALT};
    background: ${({ theme }) => theme.BG_WHITE_ALT};
    box-shadow:
        0 2px 7px 0 ${({ theme }) => theme.BOX_SHADOW_BLACK_15},
        0 2px 3px 0 ${({ theme }) => theme.BOX_SHADOW_BLACK_5};
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
            <Wrapper data-test="@guide/button-open" onClick={openGuide} $isGuideOpen={isGuideOpen}>
                <Icon size={18} icon="LIGHTBULB" />
            </Wrapper>
        </FreeFocusInside>
    );
};
