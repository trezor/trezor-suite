type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
    ? I
    : never;

type MethodFactory<Union> = UnionToIntersection<Union[keyof Union]>;

type OmitFirstArg<F> = F extends (first: any, ...args: infer P) => infer R
    ? (...args: P) => R
    : never;

type OmitEvent<E, P> = E extends null ? OmitFirstArg<P> : P;

// Find undefined in union `string | undefined`
export type ExtractUndefined<U> = (U extends undefined ? (k: U) => void : never) extends (
    k: infer I,
) => void
    ? I
    : never;

type OptionalParams<C, P> =
    ExtractUndefined<P> extends undefined
        ? (channel: C, payload?: P) => void
        : (channel: C, payload: P) => void;

export type StrictChannel = { [name: string]: any };

/**
 * Listener method transforms channels list in to listener function.
 * if generic type <E> is not set first parameter "event" will be omitted.
 *
 * usage DesktopApi.on -> ipcRenderer.on:
 * type Fn = ListenerMethod<{'foo': number, 'bar': string }>
 * equals
 * type Fn = ('foo', (payload: number) => {}) & ('bar', (payload: string) => {})
 *
 * usage ipcMain.on:
 * type Fn = ListenerMethod<{'foo': number, 'bar': string }, Event>
 * equals
 * type Fn = ('foo', (event: Event, payload: number) => {}) & ('bar', (event: Event, payload: string) => {})
 */
export type ListenerMethod<Channels extends StrictChannel, E = null> = MethodFactory<{
    [C in keyof Channels]: (
        channel: C,
        listener: OmitEvent<
            E,
            Channels[C] extends void ? (event: E) => void : (event: E, payload: Channels[C]) => void
        >,
    ) => void;
}>;

/**
 * Send method transforms channels list in to send function.
 * if generic type <E> is not set first parameter "channel" will be omitted.
 *
 * usage: DesktopApi.[method] > ipcRenderer.send
 * type Fn = ListenerMethod<{'foo': number, 'bar': string | undefined, 'xyz': void }>
 * equals
 * type Fn = (p: number) => {} & (p?: string) => {} & () => {}
 *
 * usage: webContents.send
 * type Fn = ListenerMethod<{'foo': number, 'bar': string | undefined, 'xyz': void }, Event>
 * equals
 * type Fn = (c: 'foo', p: number) => {} & (c: 'bar', p?: string) => {} & (c: 'xyz') => {}
 */
export type SendMethod<Channels extends StrictChannel, E = null> = MethodFactory<{
    [C in keyof Channels]: OmitEvent<
        E,
        Channels[C] extends void ? (channel: C) => void : OptionalParams<C, Channels[C]>
    >;
}>;

/**
 * Invoke method transforms channels list in to intersection of invoke functions.
 * if generic type <E> is not set first parameter "channel" will be omitted.
 *
 * usage in DesktopApi.[method] definition:
 * type Fn = ListenerMethod<{'foo': () => void, 'bar': (arg: number) => { success: boolean } }>;
 * equals
 * type Fn = () => Promise<void> & (arg: number) => Promise<{ success: boolean }>;
 *
 * usage in ipcRenderer.invoke:
 * type Fn = ListenerMethod<{'foo': () => void, 'bar': (arg1: number, arg2: boolean) => { success: boolean } }, Electron.IpcMainInvokeEvent>;
 * equals
 * type Fn = (channel: 'foo') => Promise<void> & (channel: 'bar', arg1: number, arg2: boolean) => Promise<{ success: boolean }>;
 */
export type InvokeMethod<Channels extends StrictChannel, E = null> = MethodFactory<{
    [C in keyof Channels]: OmitEvent<
        E,
        (channel: C, ...args: Parameters<Channels[C]>) => Promise<ReturnType<Channels[C]>>
    >;
}>;

/**
 * HandleMethod method transforms channels list in to intersection of handle functions.
 * if generic type <E> is not set first parameter "event" will be omitted.
 *
 * usage in ipcMain.handle:
 * type Fn = HandleMethod<{'foo': () => void, 'bar': (arg1: number, arg2: boolean) => { success: boolean } }, Electron.IpcMainInvokeEvent>;
 * equals
 * type Fn = (('foo', (event: Electron.IpcMainInvokeEvent) => void) & ('bar', (event: Event, arg1: number, arg2: boolean) => { success: boolean })
 */
export type HandleMethod<Channels extends StrictChannel, E = null> = MethodFactory<{
    [C in keyof Channels]: (
        channel: C,
        handler: OmitEvent<
            E,
            (
                event: E,
                ...args: Parameters<Channels[C]>
            ) => ReturnType<Channels[C]> | Promise<ReturnType<Channels[C]>>
        >,
    ) => void;
}>;
