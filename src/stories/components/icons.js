import React from 'react';

import { storiesOf } from '@storybook/react';

import icons from 'config/icons';
import Icon from 'components/Icon';

storiesOf('Icons', module)
    .addWithJSX('Top', () => <Icon icon={icons.TOP} />)
    .addWithJSX('Eye crossed', () => <Icon icon={icons.EYE_CROSSED} />)
    .addWithJSX('Eye', () => <Icon icon={icons.EYE} />)
    .addWithJSX('Checked', () => <Icon icon={icons.CHECKED} />)
    .addWithJSX('Back', () => <Icon icon={icons.BACK} />)
    .addWithJSX('Help', () => <Icon icon={icons.HELP} />)
    .addWithJSX('Refresh', () => <Icon icon={icons.REFRESH} />)
    .addWithJSX('T1', () => <Icon icon={icons.T1} />)
    .addWithJSX('Config', () => <Icon icon={icons.COG} />)
    .addWithJSX('Eject', () => <Icon icon={icons.EJECT} />)
    .addWithJSX('Close', () => <Icon icon={icons.CLOSE} />)
    .addWithJSX('Download', () => <Icon icon={icons.DOWNLOAD} />)
    .addWithJSX('Plus', () => <Icon icon={icons.PLUS} />)
    .addWithJSX('Arrow up', () => <Icon icon={icons.ARROW_UP} />)
    .addWithJSX('Arrow left', () => <Icon icon={icons.ARROW_LEFT} />)
    .addWithJSX('Arrow down', () => <Icon icon={icons.ARROW_DOWN} />)
    .addWithJSX('Chat', () => <Icon icon={icons.CHAT} />)
    .addWithJSX('Skip', () => <Icon icon={icons.SKIP} />)
    .addWithJSX('Warning', () => <Icon icon={icons.WARNING} />)
    .addWithJSX('Info', () => <Icon icon={icons.INFO} />)
    .addWithJSX('Error', () => <Icon icon={icons.ERROR} />)
    .addWithJSX('Success', () => <Icon icon={icons.SUCCESS} />);
