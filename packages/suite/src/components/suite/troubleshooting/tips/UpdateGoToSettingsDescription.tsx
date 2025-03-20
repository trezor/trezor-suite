import styled from 'styled-components';

import { typography } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { TrezorLink } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch } from 'src/hooks/suite';

const Wrapper = styled.div`
    a {
        ${typography.hint};
    }
`;

export const UpdateGoToSettingsDescription = () => {
    const dispatch = useDispatch();

    const gotToDeviceSettings = () => dispatch(goto('settings-device'));

    return (
        <Wrapper>
            <Translation
                id="TR_WIPE_OR_UPDATE_DESCRIPTION"
                values={{
                    a: chunks => (
                        <TrezorLink
                            variant="underline"
                            onClick={gotToDeviceSettings}
                            data-testid="@goto/settings"
                        >
                            {chunks}
                        </TrezorLink>
                    ),
                }}
            />
        </Wrapper>
    );
};
