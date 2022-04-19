import React from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';
import { resolveStaticPath } from '@trezor/utils';
import { useAnalytics } from '@suite-hooks';
import { useGuide } from '@guide-hooks';

const Wrapper = styled.button<{ isGuideOpen?: boolean; isModalOpen?: boolean }>`
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    z-index: ${({ isModalOpen }) =>
        isModalOpen ? variables.Z_INDEX.GUIDE_BUTTON_BESIDE_MODAL : variables.Z_INDEX.GUIDE_BUTTON};
    bottom: 18px;
    right: 18px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    border: solid 1px ${({ theme }) => theme.STROKE_GREY_ALT};
    background: ${({ theme }) => theme.BG_WHITE_ALT};
    box-shadow: 0 2px 7px 0 ${({ theme }) => theme.BOX_SHADOW_BLACK_15},
        0 2px 3px 0 ${({ theme }) => theme.BOX_SHADOW_BLACK_5};
    opacity: ${({ isGuideOpen }) => (isGuideOpen ? 0 : 1)};
    transition: opacity 0.3s ease 0.3s;

    & > img {
        display: block;
    }
`;

export const GuideButton = () => {
    const { openGuide, isGuideOpen, isModalOpen } = useGuide();
    const analytics = useAnalytics();

    const handleButtonClick = () => {
        openGuide();
        analytics.report({
            type: 'menu/guide',
        });
    };

    return (
        <Wrapper
            isModalOpen={isModalOpen}
            isGuideOpen={isGuideOpen}
            data-test="@guide/button-open"
            onClick={handleButtonClick}
        >
            <img
                src={resolveStaticPath('/images/suite/lightbulb.svg')}
                width="18"
                height="18"
                alt=""
            />
        </Wrapper>
    );
};
