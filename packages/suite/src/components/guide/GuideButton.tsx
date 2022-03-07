import React from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';
import { resolveStaticPath } from '@suite-utils/build';
import { useAnalytics } from '@suite-hooks';
import { useGuide } from '@guide-hooks';

const Wrapper = styled.button<{ guideOpen?: boolean; isModalOpen?: boolean }>`
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    z-index: ${props =>
        props.isModalOpen
            ? variables.Z_INDEX.GUIDE_BUTTON_BESIDE_MODAL
            : variables.Z_INDEX.GUIDE_BUTTON};
    bottom: 18px;
    right: 18px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    border: solid 1px ${props => props.theme.STROKE_GREY_ALT};
    background: ${props => props.theme.BG_WHITE_ALT};
    box-shadow: 0 2px 7px 0 ${props => props.theme.BOX_SHADOW_BLACK_15},
        0 2px 3px 0 ${props => props.theme.BOX_SHADOW_BLACK_5};

    & > img {
        display: block;
    }

    opacity: ${props => (props.guideOpen ? 0 : 1)};
    transition: opacity 0.3s ease 0.3s;
`;

const GuideButton = () => {
    const { openGuide, guideOpen, isModalOpen } = useGuide();
    const analytics = useAnalytics();

    return (
        <Wrapper
            isModalOpen={isModalOpen}
            guideOpen={guideOpen}
            data-test="@guide/button-open"
            onClick={() => {
                openGuide();
                analytics.report({
                    type: 'menu/guide',
                });
            }}
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

export default GuideButton;
