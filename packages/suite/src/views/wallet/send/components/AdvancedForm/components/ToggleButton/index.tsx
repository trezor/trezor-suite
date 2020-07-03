import React from 'react';
import styled from 'styled-components';
import { variables, colors, Icon } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { useSendFormContext } from '@wallet-hooks';

const Wrapper = styled.div`
    display: flex;
    min-height: 41px;
    align-items: center;
    justify-content: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.BLACK17};
`;

const ToggleIcon = styled(Icon)`
    margin-left: 5px;
`;

const Text = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
`;

export default () => {
    const { advancedForm, updateContext } = useSendFormContext();

    return (
        <Wrapper>
            <Text
                onClick={() => {
                    updateContext({ advancedForm: !advancedForm });
                }}
            >
                {advancedForm ? (
                    <Translation id="TR_HIDE_ADVANCED_OPTIONS" />
                ) : (
                    <Translation id="TR_SHOW_ADVANCED_OPTIONS" />
                )}
                <ToggleIcon
                    icon="ARROW_DOWN"
                    color={colors.BLACK17}
                    size={20}
                    isActive={advancedForm}
                    canAnimate={advancedForm}
                />
            </Text>
        </Wrapper>
    );
};
