import { Warning as WarningComponent } from '../../index';

export default {
    title: 'Misc/Warning',
    component: WarningComponent,
};

export const Warning = {
    args: {
        children: 'Insert text here.',
        withIcon: true,
    },
    argTypes: {
        className: {
            control: false,
        },
    },
};
