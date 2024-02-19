import styled from 'styled-components';

import { Icon, colors, animations } from '@trezor/components';

const IconWrapper = styled.div`
    width: 40px;
    height: 40px;
    background-color: #c4c4c44d;
    border-radius: 25px;
    justify-content: center;
    align-items: center;
    display: flex;
    cursor: pointer;
    box-shadow: 0 1px 5px 0 rgb(0 0 0 / 10%);
    transition: background-color 0.3s;
    animation: ${animations.FADE_IN} 0.15s ease-in-out;

    :hover {
        background-color: #c4c4c480;
    }
`;

type FloatingMenuProps = { onShowAnalyticsConsent: () => void };

export const FloatingMenu = ({ onShowAnalyticsConsent }: FloatingMenuProps) => (
    <IconWrapper onClick={onShowAnalyticsConsent} data-test-id="@analytics/settings">
        <Icon icon="SETTINGS" size={22} color={colors.TYPE_DARK_GREY} />
    </IconWrapper>
);
