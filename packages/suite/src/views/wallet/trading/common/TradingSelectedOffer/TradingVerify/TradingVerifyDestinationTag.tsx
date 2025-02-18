import { ReactNode, useState } from 'react';

import { Button, Column, Row, Switch } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useGuideOpenNode } from 'src/hooks/guide';
import { DESTINATION_TAG_GUIDE_PATH } from 'src/views/wallet/send/Options/RippleOptions/DestinationTag';

export interface TradingVerifyDestinationTagProps {
    inputComponent: ReactNode;
    onToggle?: (toggled: boolean) => void;
    required: boolean;
}

export const TradingVerifyDestinationTag = ({
    inputComponent,
    onToggle,
    required,
}: TradingVerifyDestinationTagProps) => {
    const { openNodeById } = useGuideOpenNode();

    const [enabled, setEnabled] = useState<boolean>(required);

    const handleToggle = (isChecked: boolean) => {
        setEnabled(isChecked);
        onToggle?.(isChecked);
    };

    const handleOpenGuide = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        openNodeById(DESTINATION_TAG_GUIDE_PATH);
    };

    return (
        <Column gap={spacings.md}>
            <Row justifyContent="space-between">
                <Switch
                    isChecked={enabled}
                    onChange={handleToggle}
                    label={<Translation id="DESTINATION_TAG_SWITCH" />}
                    isDisabled={required}
                />
                <Button variant="tertiary" type="button" size="tiny" onClick={handleOpenGuide}>
                    <Translation id="DESTINATION_TAG_GUIDE_LINK" />
                </Button>
            </Row>

            {enabled && inputComponent}
        </Column>
    );
};
