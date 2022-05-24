import React from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';
import { resolveStaticPath } from '@trezor/utils';
import { useGuide } from '@guide-hooks';
import { FreeFocusInside } from 'react-focus-lock';

const Wrapper = styled.button`
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    z-index: ${variables.Z_INDEX.GUIDE_BUTTON};
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
    transition: opacity 0.3s ease 0.3s;

    & > img {
        display: block;
    }
`;

export const GuideButton = () => {
    const { openGuide } = useGuide();

    return (
        <FreeFocusInside>
            <Wrapper data-test="@guide/button-open" onClick={openGuide}>
                <img
                    src={resolveStaticPath('/images/suite/lightbulb.svg')}
                    width="18"
                    height="18"
                    alt=""
                />
            </Wrapper>
        </FreeFocusInside>
    );
};
