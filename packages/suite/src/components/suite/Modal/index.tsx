import React, { useMemo } from 'react';

import { colors, Icon, Modal as TrezorModal, ModalProps, variables } from '@trezor/components';
import { useGuide } from '@guide-hooks';
import styled from 'styled-components';

const GuideIcon = styled(Icon)`
    svg {
        width: 28px;
        height: 28px;
        padding: 5px;
    }

    ${variables.SCREEN_QUERY.ABOVE_MOBILE} {
        svg {
            width: 32px;
            height: 32px;
        }
    }

    ${variables.SCREEN_QUERY.ABOVE_TABLET} {
        display: none;
    }
`;

const Modal: React.FC<ModalProps> = ({ headerComponents, ...props }) => {
    const { guideOpen, isModalOpen, isGuideOnTop, openGuide } = useGuide();

    const GuideButton = useMemo(
        () => (
            <GuideIcon
                icon="LIGHTBULB"
                size={22}
                hoverColor={colors.TYPE_ORANGE}
                onClick={openGuide}
            />
        ),
        [openGuide],
    );

    return (
        <TrezorModal
            guideOpen={guideOpen && isModalOpen && !isGuideOnTop}
            headerComponents={[GuideButton, ...(headerComponents || [])]}
            {...props}
        />
    );
};
export { Modal };
export type { ModalProps };
