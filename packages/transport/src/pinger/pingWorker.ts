import { ping } from './pingCommon';

type Request = { id: number; payload: { url: string } };
type Response = { id: number; payload: { success: boolean } };

setTimeout(() => {
    postMessage({ id: -1, payload: { success: true } });
}, 10);

onmessage = ({ data }: { data: Request }) => {
    const { id, payload } = data;
    const { url } = payload;

    ping(url).then(success => postMessage({ id, payload: { success } }));
};

// eslint-disable-next-line import/no-default-export
export default null as unknown as () => {
    postMessage: (_: Request) => void;
    onmessage: (_: { data: Response }) => void;
    onerror: (_: Error) => void;
    terminate: () => void;
};
