import { Note as NoteComponent } from './Note';

export default {
    title: 'Misc/Note',
    component: NoteComponent,
};

export const Note = {
    args: {
        children: 'Example tooltip',
    },
    argTypes: {
        className: {
            control: false,
        },
        color: {
            control: 'color',
        },
    },
};
