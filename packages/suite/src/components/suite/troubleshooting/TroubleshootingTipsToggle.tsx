import { ReactNode } from 'react';

import { Collapsible, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from '../Translation';

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
            <Collapsible.ToggleIcon isOpen={isOpen} />
        </Row>
    </Row>
);
