import { Button, Row } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';
import { useSendFormContext } from 'src/hooks/wallet';
export const CardanoOptions = () => {
    const { addOutput } = useSendFormContext();

    return (
        <Row justifyContent="flex-end">
            <Button
                intent="neutral"
                priority="secondary"
                iconLeft="plus"
                data-testid="add-output"
                onClick={addOutput}
            >
                <Translation id="RECIPIENT_ADD" />
            </Button>
        </Row>
    );
};
