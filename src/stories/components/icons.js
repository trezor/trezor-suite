import Icon from 'components/Icon';
import React from 'react';
import icons from 'config/icons';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';
import centered from '@storybook/addon-centered';
import { withInfo } from '@storybook/addon-info';

const Wrapper = styled.div``;

Wrapper.displayName = 'Wrapper';

storiesOf('Icons', module)
    .addDecorator(
        withInfo({
            header: true,
        }),
    )
    .addDecorator(centered)
    .add('icons', () => (
        <Wrapper>
            <Icon icon={icons.TOP} />
            <Icon icon={icons.EYE_CROSSED} />
            <Icon icon={icons.EYE} />
            <Icon icon={icons.CHECKED} />
            <Icon icon={icons.BACK} />
            <Icon icon={icons.HELP} />
            <Icon icon={icons.REFRESH} />
            <Icon icon={icons.T1} />
            <Icon icon={icons.COG} />
            <Icon icon={icons.EJECT} />
            <Icon icon={icons.CLOSE} />
            <Icon icon={icons.DOWNLOAD} />
            <Icon icon={icons.PLUS} />
            <Icon icon={icons.ARROW_UP} />
            <Icon icon={icons.ARROW_LEFT} />
            <Icon icon={icons.ARROW_DOWN} />
            <Icon icon={icons.CHAT} />
            <Icon icon={icons.SKIP} />
            <Icon icon={icons.WARNING} />
            <Icon icon={icons.INFO} />
            <Icon icon={icons.ERROR} />
            <Icon icon={icons.SUCCESS} />
        </Wrapper>
    ));
