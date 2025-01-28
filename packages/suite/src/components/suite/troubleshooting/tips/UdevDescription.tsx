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

export const UdevDescription = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto('suite-udev'));

    return (
        <Wrapper data-testid="@connect-device-prompt/unreadable-udev">
            <Translation
                id="TR_TROUBLESHOOTING_TIP_UDEV_INSTALL_DESCRIPTION"
                values={{
                    a: chunks => (
                        <TrezorLink
                            variant="underline"
                            onClick={handleClick}
                            data-testid="@goto/udev"
                        >
                            {chunks}
                        </TrezorLink>
                    ),
                }}
            />
        </Wrapper>
    );
};
