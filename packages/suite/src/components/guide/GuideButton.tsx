import React, { ButtonHTMLAttributes } from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';
import { resolveStaticPath } from '@suite-utils/build';
import { useLayoutSize, useAnalytics } from '@suite-hooks';
import { useGuide } from '@guide-hooks';

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
    border: solid 1px ${props => props.theme.STROKE_GREY_ALT};
    background: ${props => props.theme.BG_WHITE_ALT};
    box-shadow: 0 2px 7px 0 ${props => props.theme.BOX_SHADOW_BLACK_15},
        0 2px 3px 0 ${props => props.theme.BOX_SHADOW_BLACK_5};

    & > img {
        display: block;
    }
`;

const GuideButton = (props: ButtonHTMLAttributes<HTMLButtonElement>) => {
    const { isMobileLayout } = useLayoutSize();
    const { openGuide } = useGuide();
    const analytics = useAnalytics();

    if (isMobileLayout) return null;

    return (
        <Wrapper
            {...props}
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
