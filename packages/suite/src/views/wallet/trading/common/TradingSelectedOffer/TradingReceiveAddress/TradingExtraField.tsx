import { type ReactNode, useState } from 'react';

import { type ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { Button, Column, Row, Switch } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useGuideOpenNode } from 'src/hooks/guide';
import { DESTINATION_TAG_GUIDE_PATH } from 'src/views/wallet/send/Options/MiscNetworkOptions/DestinationTag';

interface TradingExtraFieldProps {
    inputComponent: ReactNode;
    onToggle?: (toggled: boolean) => void;
    required: boolean;
    extraFieldDescription?: ExchangeTrade['extraFieldDescription'];
    isDisabled?: boolean;
    defaultChecked?: boolean;
}

export const TradingExtraField = ({
    inputComponent,
    onToggle,
    required,
    extraFieldDescription,
    isDisabled = false,
    defaultChecked = false,
}: TradingExtraFieldProps) => {
    const { openNodeById } = useGuideOpenNode();

    const [enabled, setEnabled] = useState<boolean>(defaultChecked ?? required);

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
                    data-testid="@trading/extra-field-switch"
                    isChecked={enabled}
                    onChange={handleToggle}
                    label={
                        extraFieldDescription ? (
                            <Translation
                                id="TR_EXCHANGE_EXTRA_FIELD_SWITCH"
                                values={{ extraFieldName: extraFieldDescription.name }}
                            />
                        ) : (
                            <Translation id="DESTINATION_TAG_SWITCH" />
                        )
                    }
                    isDisabled={isDisabled || required}
                />
                <Button
                    intent="neutral"
                    priority="secondary"
                    type="button"
                    size="small"
                    onClick={handleOpenGuide}
                >
                    <Translation id="DESTINATION_TAG_GUIDE_LINK" />
                </Button>
            </Row>

            {enabled && inputComponent}
        </Column>
    );
};
