import React from 'react';

import { storiesOf } from '@storybook/react';

import ICONS from 'config/icons';
import Icon from 'components/Icon';

storiesOf('Icons', module)
    .addWithJSX('Top', () => <Icon icon={ICONS.TOP} />)
    .addWithJSX('Eye crossed', () => <Icon icon={ICONS.EYE_CROSSED} />)
    .addWithJSX('Eye', () => <Icon icon={ICONS.EYE} />)
    .addWithJSX('Checked', () => <Icon icon={ICONS.CHECKED} />)
    .addWithJSX('Back', () => <Icon icon={ICONS.BACK} />)
    .addWithJSX('Help', () => <Icon icon={ICONS.HELP} />)
    .addWithJSX('Refresh', () => <Icon icon={ICONS.REFRESH} />)
    .addWithJSX('T1', () => <Icon icon={ICONS.T1} />)
    .addWithJSX('Config', () => <Icon icon={ICONS.COG} />)
    .addWithJSX('Eject', () => <Icon icon={ICONS.EJECT} />)
    .addWithJSX('Close', () => <Icon icon={ICONS.CLOSE} />)
    .addWithJSX('Download', () => <Icon icon={ICONS.DOWNLOAD} />)
    .addWithJSX('Plus', () => <Icon icon={ICONS.PLUS} />)
    .addWithJSX('Arrow up', () => <Icon icon={ICONS.ARROW_UP} />)
    .addWithJSX('Arrow left', () => <Icon icon={ICONS.ARROW_LEFT} />)
    .addWithJSX('Arrow down', () => <Icon icon={ICONS.ARROW_DOWN} />)
    .addWithJSX('Chat', () => <Icon icon={ICONS.CHAT} />)
    .addWithJSX('Skip', () => <Icon icon={ICONS.SKIP} />)
    .addWithJSX('Warning', () => <Icon icon={ICONS.WARNING} />)
    .addWithJSX('Info', () => <Icon icon={ICONS.INFO} />)
    .addWithJSX('Error', () => <Icon icon={ICONS.ERROR} />)
    .addWithJSX('Success', () => <Icon icon={ICONS.SUCCESS} />);
