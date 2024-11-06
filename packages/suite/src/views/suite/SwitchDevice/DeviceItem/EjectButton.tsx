import { useTheme } from 'styled-components';

import { Tooltip, Icon } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { ContentType } from '../types';

interface EjectButtonProps {
    setContentType: (contentType: ContentType) => void;
    'data-testid'?: string;
}

export const EjectButton = ({ setContentType, 'data-testid': dataTest }: EjectButtonProps) => {
    const theme = useTheme();

    const onEjectClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        setContentType('eject-confirmation');
        e.stopPropagation();
    };

    return (
        <Tooltip cursor="pointer" content={<Translation id="TR_EJECT_HEADING" />}>
            <Icon
                data-testid={`${dataTest}/eject-button`}
                name="eject"
                size={22}
                variant="tertiary"
                hoverColor={theme.textDefault}
                onClick={onEjectClick}
            />
        </Tooltip>
    );
};
