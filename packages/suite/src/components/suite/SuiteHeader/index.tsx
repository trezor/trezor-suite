import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

import { goto } from '@suite-actions/routerActions';
import { colors, Button } from '@trezor/components';
import { getRoute } from '@suite-utils/router';
import DeviceMenu from '@suite-components/DeviceMenu';
import l10nCommonMessages from '@suite-views/index.messages';

const StyledSuiteHeader = styled.div`
    display: flex;
    padding-right: 15px;
    border-bottom: 1px solid ${colors.BODY};
    border-radius: 4px 4px 0px 0px;
    align-items: center;
    box-sizing: border-box;
    justify-content: space-between;
    width: 100%;
    background: ${colors.WHITE};
    max-width: 1170px;
    flex-direction: row;
`;

const Left = styled.div``;
const Right = styled.div``;

const SuiteHeader = ({ ...props }) => (
    <StyledSuiteHeader {...props}>
        <Left>
            <DeviceMenu data-test="@suite/device_selection" />
        </Left>
        <Right>
            <Button onClick={() => goto(getRoute('suite-device-settings'))}>
                <FormattedMessage {...l10nCommonMessages.TR_DEVICE_SETTINGS} />
            </Button>
        </Right>
    </StyledSuiteHeader>
);

export default SuiteHeader;
