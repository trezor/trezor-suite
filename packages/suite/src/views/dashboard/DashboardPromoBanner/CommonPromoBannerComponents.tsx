import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { IconButton } from '@trezor/components';
import { XIcon } from '@trezor/icons';
const CloseButtonContainer = styled.div`
    position: absolute;
    top: 12px;
    right: 12px;
`;

type CloseButtonProps = {
    onClose: () => void;
    isInverse?: boolean;
};

export const CloseButton = ({ onClose, isInverse = false }: CloseButtonProps) => (
    <CloseButtonContainer>
        <IconButton
            icon={XIcon}
            intent="neutral"
            priority="secondary"
            onClick={onClose}
            isInverse={isInverse}
            tooltip={{ content: <Translation id="TR_CLOSE" /> }}
        />
    </CloseButtonContainer>
);
