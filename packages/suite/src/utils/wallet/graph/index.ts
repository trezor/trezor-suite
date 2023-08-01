/*
    The Graph utilities are organized into three distinct files. 
    This structure is implemented to prevent the '@trezor/connect' from being bundled into the worker file. 

    When working within Suite, you can import from this file. 
    However, it's important to note that these utilities should not be imported from the worker (graph.ts file).
*/

export * from './utils'; // Utilities specific to suite.
export * from './utilsShared'; // Utilities that are shared between suite and worker.
export * from './utilsWorker'; // Utilities specific to the worker process.
