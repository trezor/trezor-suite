import styled from 'styled-components';

import { useTranslation } from '@suite/intl';
import { IconButton } from '@trezor/components';
import { PlusIcon } from '@trezor/icons';

// Matches the height of the large search input, so the button reads as a square next to it.
const SQUARE_BUTTON_SIZE = 56;

const SquareButtonContainer = styled.div`
    display: flex;
    flex: 0 0 auto;
    width: ${SQUARE_BUTTON_SIZE}px;
    height: ${SQUARE_BUTTON_SIZE}px;

    > button {
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }
`;

type AddCustomNetworkButtonProps = {
    onClick: () => void;
};

export const AddCustomNetworkButton = ({ onClick }: AddCustomNetworkButtonProps) => {
    const { translationString } = useTranslation();

    return (
        <SquareButtonContainer>
            <IconButton
                icon={PlusIcon}
                size="large"
                intent="neutral"
                priority="secondary"
                aria-label={translationString('TR_ADD_CUSTOM_NETWORK')}
                tooltip={{ content: translationString('TR_ADD_CUSTOM_NETWORK') }}
                data-testid="@settings/wallet/add-custom-network"
                onClick={onClick}
            />
        </SquareButtonContainer>
    );
};
