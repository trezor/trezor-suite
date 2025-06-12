import { useState } from 'react';

import { thpActions } from '@suite-common/thp';
import { PinInput, Row, Spinner } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { SpacingValues, spacings } from '@trezor/theme';

import { useDispatch } from '../../hooks/suite';

const SPINNER_SIZE = 32;

type ThpPairingPinEntryProps =
    | {
          disabled?: true;
          lastCode?: undefined;
      }
    | { disabled: true; lastCode: string };

export const ThpPairingCodeEntry = ({ disabled, lastCode }: ThpPairingPinEntryProps) => {
    const [isLoading, setLoading] = useState(false);

    const dispatch = useDispatch();

    const onCodeEntry = (tag: string) => {
        setLoading(true);
        dispatch(thpActions.setLastThpCode({ code: tag }));
        TrezorConnect.uiResponse({
            type: 'ui-receive_thp_pairing_tag',
            payload: {
                source: 'code-entry',
                tag,
            },
        });
    };

    return (
        <Row
            gap={spacings.xl}
            margin={{
                right: isLoading
                    ? // This is a bit hack, but I think it is better to make it explicitly
                      // bound to SPINNER_SIZE+gap so it is clear why it is shifted (to prevent jumping)
                      // This is relevant only when parent component sets margin (e.g., centering)
                      (-(SPINNER_SIZE + spacings.xl) as SpacingValues)
                    : undefined,
            }}
        >
            <PinInput
                length={6}
                onComplete={onCodeEntry}
                disabled={isLoading || disabled === true}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus={true}
                defaultCode={lastCode}
            />
            {isLoading && <Spinner size={SPINNER_SIZE} />}
        </Row>
    );
};
