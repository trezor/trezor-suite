import { Translation } from '@suite/intl';
import { Button, Row, Tooltip } from '@trezor/components';

import { useSendFormContext } from 'src/hooks/wallet';

import { OnOffSwitcher } from '../OnOffSwitcher';

export const MiscNetworkOptions = () => {
    const { getDefaultValue, toggleOption, composeTransaction } = useSendFormContext();

    const options = getDefaultValue('options', []);
    const broadcastEnabled = options.includes('broadcast');

    return (
        <Row>
            <Tooltip content={<Translation id="BROADCAST_TOOLTIP" />} cursor="pointer">
                <Button
                    intent="neutral"
                    priority="secondary"
                    iconLeft="broadcast"
                    onClick={() => {
                        toggleOption('broadcast');
                        composeTransaction();
                    }}
                >
                    <Row>
                        <Translation id="BROADCAST" />
                        <OnOffSwitcher isOn={broadcastEnabled} />
                    </Row>
                </Button>
            </Tooltip>
        </Row>
    );
};
