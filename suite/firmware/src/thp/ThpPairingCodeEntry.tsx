import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectThpPairingRequestId } from '@suite-common/thp';
import { PinInput, Row, Spinner } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { type SpacingValues } from '@trezor/theme';

const SPINNER_SIZE = 32;

type ThpPairingPinEntryProps =
    | {
          disabled?: true;
          lastCode?: undefined;
      }
    | { disabled: true; lastCode: string };

export const ThpPairingCodeEntry = ({ disabled, lastCode }: ThpPairingPinEntryProps) => {
    const [isLoading, setLoading] = useState(false);
    const requestId = useSelector(selectThpPairingRequestId);

    const onCodeEntry = useCallback(
        (tag: string) => {
            setLoading(true);
            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_pairing_tag',
                payload: { tag },
                requestId,
            });
        },
        [requestId],
    );

    return (
        <Row
            gap={24}
            margin={{
                right: isLoading
                    ? // This is a bit hack, but I think it is better to make it explicitly
                      // bound to SPINNER_SIZE+gap so it is clear why it is shifted (to prevent jumping)
                      // This is relevant only when parent component sets margin (e.g., centering)
                      (-(SPINNER_SIZE + 24) as SpacingValues)
                    : undefined,
            }}
            width="fit-content" // This is important because of the above negative margin hack
        >
            <PinInput
                length={6}
                onComplete={onCodeEntry}
                isDisabled={isLoading || disabled === true}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus={true}
                defaultCode={lastCode}
            />
            {isLoading && <Spinner size={SPINNER_SIZE} isDisabled={true} />}
        </Row>
    );
};
