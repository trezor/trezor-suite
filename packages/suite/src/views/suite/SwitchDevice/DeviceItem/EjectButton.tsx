import styled, { useTheme } from 'styled-components';

import { Tooltip, Icon } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { borders, spacingsPx } from '@trezor/theme';
import { ContentType } from '../types';

const EjectContainer = styled.div`
    position: absolute;
    right: ${spacingsPx.xs};
    top: ${spacingsPx.xs};
    background-color: white;
    border-radius: ${borders.radii.full};
    padding: ${spacingsPx.xxs};
`;

interface EjectButtonProps {
    setContentType: (contentType: ContentType) => void;
    dataTest?: string;
}

export const EjectButton = ({ setContentType, dataTest }: EjectButtonProps) => {
    const theme = useTheme();

    const onEjectClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        setContentType('ejectConfirmation');
        e.stopPropagation();
    };

    return (
        <EjectContainer>
            <Tooltip hasArrow cursor="pointer" content={<Translation id="TR_EJECT_HEADING" />}>
                <Icon
                    data-test={`${dataTest}/eject-button`}
                    icon="EJECT"
                    size={22}
                    color={theme.TYPE_LIGHT_GREY}
                    hoverColor={theme.TYPE_DARK_GREY}
                    onClick={onEjectClick}
                />
            </Tooltip>
        </EjectContainer>
    );
};
