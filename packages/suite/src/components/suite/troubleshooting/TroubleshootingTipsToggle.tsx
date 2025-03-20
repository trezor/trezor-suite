import { ReactNode } from 'react';

import styled from 'styled-components';

import { Icon, Row, Text, iconSizes } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from '../Translation';

const Toggle = styled.div`
    transition: opacity 0.15s;
`;

type TroubleshootingTipsToggleProps = {
    children?: ReactNode;
    isOpen: boolean;
};

export const TroubleshootingTipsToggle = ({ children, isOpen }: TroubleshootingTipsToggleProps) => (
    <Row justifyContent="center" flex="1" margin={{ bottom: spacings.xs }}>
        <Row gap={spacings.xs} cursor="pointer">
            <Text variant="tertiary">
                {children !== undefined ? children : <Translation id="TR_TROUBLE_SHOOTING_TIPS" />}
            </Text>
            <Toggle>
                <Icon
                    name={isOpen ? 'caretCircleUp' : 'caretCircleDown'}
                    variant="tertiary"
                    size={iconSizes.medium}
                />
            </Toggle>
        </Row>
    </Row>
);
