import { useState } from 'react';

import { Translation } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { removeCustomEvmNetworkThunk } from '@suite-common/wallet-core';
import { Button, Card, Column, Row, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

type DisableCustomNetworkCardProps = {
    symbol: NetworkSymbol;
    onDisabled: () => void;
};

export const DisableCustomNetworkCard = ({ symbol, onDisabled }: DisableCustomNetworkCardProps) => {
    const { dispatch } = useServices(injectDispatch);
    const [isConfirmationShown, setIsConfirmationShown] = useState(false);
    const [isDisabling, setIsDisabling] = useState(false);

    const onConfirm = async () => {
        setIsDisabling(true);
        await dispatch(removeCustomEvmNetworkThunk({ symbol }));
        onDisabled();
    };

    return (
        <Card>
            <Row gap={16} justifyContent="space-between" alignItems="center">
                <Column flex="1" gap={4} alignItems="flex-start">
                    <Text typographyStyle="body-md-strong">
                        <Translation id="TR_DISABLE_NETWORK" />
                    </Text>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_DISABLE_NETWORK_DESCRIPTION" />
                    </Text>
                </Column>

                {isConfirmationShown ? (
                    <Row gap={8} flex="0 0 auto">
                        <Button
                            intent="neutral"
                            priority="secondary"
                            isDisabled={isDisabling}
                            onClick={() => setIsConfirmationShown(false)}
                        >
                            <Translation id="TR_CANCEL" />
                        </Button>
                        <Button
                            intent="critical"
                            isLoading={isDisabling}
                            onClick={onConfirm}
                            data-testid="@settings/advance/disable-network/confirm"
                        >
                            <Translation id="TR_CONFIRM" />
                        </Button>
                    </Row>
                ) : (
                    <Button
                        intent="critical"
                        priority="secondary"
                        onClick={() => setIsConfirmationShown(true)}
                        data-testid="@settings/advance/disable-network"
                    >
                        <Translation id="TR_DISABLE" />
                    </Button>
                )}
            </Row>
        </Card>
    );
};
