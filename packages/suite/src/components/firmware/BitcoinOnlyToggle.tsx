import React from 'react';
import styled from 'styled-components';

import { P, colors } from '@trezor/components';
import { Translation } from '@suite-components';
import { AppState } from '@suite-types';

const InlineLink = styled.span`
    text-decoration: underline;
    cursor: pointer;
`;

interface Props {
    isToggled: AppState['firmware']['btcOnly'];
    onToggle: () => void;
}

const StyledP = styled(P)`
    color: ${colors.BLACK50};
    margin-bottom: 16px;
`;

const BitcoinOnlyToggle = ({ isToggled, onToggle }: Props) => {
    if (!isToggled) {
        return (
            <StyledP size="small">
                <Translation
                    id="TR_ALTERNATIVELY_YOU_MAY_INSTALL"
                    values={{
                        TR_FIRMWARE_TYPE: (
                            <InlineLink
                                onClick={onToggle}
                                data-test="@firmware/toggle-bitcoin-only/btc"
                            >
                                <Translation id="TR_FIRMWARE_TYPE_BTC_ONLY" />
                            </InlineLink>
                        ),
                    }}
                />
            </StyledP>
        );
    }
    return (
        <StyledP size="small" color={colors.BLACK50}>
            <Translation
                id="TR_ALTERNATIVELY_YOU_MAY_INSTALL"
                values={{
                    TR_FIRMWARE_TYPE: (
                        <InlineLink
                            onClick={onToggle}
                            data-test="@firmware/toggle-bitcoin-only/full"
                        >
                            <Translation id="TR_FIRMWARE_TYPE_FULL" />
                        </InlineLink>
                    ),
                }}
            />
        </StyledP>
    );
};

export default BitcoinOnlyToggle;
