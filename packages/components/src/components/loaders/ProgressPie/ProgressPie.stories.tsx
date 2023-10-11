import { ProgressPie as ProgressPieComponent } from './ProgressPie';

export default {
    title: 'Loaders/ProgressPie',
    component: ProgressPieComponent,
};

export const ProgressPie = {
    args: {
        progress: 21,
    },
    argTypes: {
        backgroundColor: { control: 'color' },
        className: { control: false },
        children: { control: false },
        color: { control: 'color' },
    },
};
