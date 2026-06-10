import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { IconButton } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

const CloseButtonContainer = styled.div`
    position: absolute;
    top: ${spacingsPx.sm};
    right: ${spacingsPx.sm};
`;

type CloseButtonProps = {
    onClose: () => void;
    isInverse?: boolean;
};

export const CloseButton = ({ onClose, isInverse = false }: CloseButtonProps) => (
    <CloseButtonContainer>
        <IconButton
            icon="x"
            intent="neutral"
            priority="secondary"
            onClick={onClose}
            isInverse={isInverse}
            tooltip={{ content: <Translation id="TR_CLOSE" /> }}
        />
    </CloseButtonContainer>
);
