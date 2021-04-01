import React from 'react';
import { Warning } from '../../index';
import { storiesOf } from '@storybook/react';

storiesOf('Warning', module).add('All', () => <Warning>Warning! Here dragons abound. 🐲</Warning>);
