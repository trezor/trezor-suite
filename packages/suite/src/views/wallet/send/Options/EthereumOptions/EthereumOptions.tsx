import { Translation } from '@suite/intl';
import { type FormOptions } from '@suite-common/wallet-types';
import { Button, Column, Row, Tooltip } from '@trezor/components';

import { useSendFormContext } from 'src/hooks/wallet';

import { EthereumData } from './EthereumData';
import { OnOffSwitcher } from '../OnOffSwitcher';

export const EthereumOptions = () => {
    const { getDefaultValue, toggleOption, composeTransaction } = useSendFormContext();

    const options = getDefaultValue('options', []);
    const dataEnabled = options.includes('transactionData');
    const tokenValue = getDefaultValue<string, string | undefined>('outputs.0.token', undefined);
    const broadcastEnabled = options.includes('broadcast');

    const toggle = (option: FormOptions) => {
        toggleOption(option);
        composeTransaction();
    };
    const toggleData = () => toggle('transactionData');
    const toggleBroadcast = () => toggle('broadcast');

    return (
        <Column gap={16}>
            <Row gap={8}>
                {!dataEnabled && !tokenValue && (
                    <Tooltip content={<Translation id="DATA_ETH_ADD_TOOLTIP" />} cursor="pointer">
                        <Button
                            intent="neutral"
                            priority="secondary"
                            iconLeft="database"
                            data-testid="send/open-ethereum-data"
                            onClick={toggleData}
                        >
                            <Translation id="DATA_ETH_ADD" />
                        </Button>
                    </Tooltip>
                )}
                <Tooltip content={<Translation id="BROADCAST_TOOLTIP" />} cursor="pointer">
                    <Button
                        intent="neutral"
                        priority="secondary"
                        iconLeft="broadcast"
                        data-testid="send/broadcast"
                        onClick={toggleBroadcast}
                    >
                        <Row>
                            <Translation id="BROADCAST" />
                            <OnOffSwitcher isOn={broadcastEnabled} />
                        </Row>
                    </Button>
                </Tooltip>
            </Row>

            {dataEnabled && <EthereumData close={toggleData} />}
        </Column>
    );
};
