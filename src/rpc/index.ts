export interface Router {
    [funcName: string]: (...args: any[]) => any | Promise<any>
}

export type PromisedType<T> = T extends Promise<infer R> ? R : T;

export type Client<R extends Router> = {
    [FUNC_NAME in keyof R]: ReturnType<R[FUNC_NAME]> extends Observable<infer T>
        ? {
            observe: (...args: Parameters<R[FUNC_NAME]>) => (
                handlers: {
                    onNext: (data: T) => void,
                    onError?: (error: any) => void,    
                    onComplete?: () => void,    
                }
            ) => () => void
        } : {
            call: (...args: Parameters<R[FUNC_NAME]>) => Promise<
                PromisedType<
                    ReturnType<R[FUNC_NAME]>
                >
            >
        };
}

export function makeRouter<R extends Router>(router: R): R {
    return router;
}

export function serve<R extends Router>(router: R) {
    const observerCleanupFunctions: {
        [key: string]: () => void;
    } = {};

    figma.ui.onmessage = async (
        message: {
            seq: number,
            type: 'call',
            functionName: string,
            args: any[]
        } | {
            seq: number,
            type: 'observe',
            functionName: string,
            args: any[]
        } | {
            seq: number,
            type: 'dispose',
        }
    ) => {
        if (message.type === 'call') {
            try {
                const returnedValue = router[message.functionName](...message.args);

                if (returnedValue instanceof Promise) {
                    try {
                        const value = await returnedValue;

                        figma.ui.postMessage({
                            seq: message.seq,
                            type: 'accept',
                            value: value
                        }, {
                            origin: '*'
                        });
                    } catch (error) {
                        figma.ui.postMessage({
                            seq: message.seq,
                            type: 'reject',
                            error: `${error}`
                        }, {
                            origin: '*'
                        });
                    }
                }
            } catch (error) {
                figma.ui.postMessage({
                    seq: message.seq,
                    type: 'reject',
                    error: `${error}`
                }, {
                    origin: '*'
                });
            }
        } else if (message.type === 'observe') {
            try {
                const returnedValue = router[message.functionName](...message.args);

                if (!(returnedValue instanceof Observable)) {
                    figma.ui.postMessage({
                        seq: message.seq,
                        type: 'reject',
                        error: `function does not return an observable`
                    }, {
                        origin: '*'
                    });

                    figma.ui.postMessage({
                        seq: message.seq,
                        type: 'complete'
                    }, {
                        origin: '*'
                    });

                    return;
                }

                try {
                    const cleanup = returnedValue.emitter({
                        next: (value: any) => {
                            figma.ui.postMessage({
                                seq: message.seq,
                                type: 'accept',
                                value: value
                            }, {
                                origin: '*'
                            });
                        },
                        complete: () => {
                            figma.ui.postMessage({
                                seq: message.seq,
                                type: 'complete'
                            }, {
                                origin: '*'
                            });

                            cleanup?.();
                        }
                    });

                    observerCleanupFunctions[`${message.seq}`] = () => {
                        cleanup?.();
                        delete observerCleanupFunctions[`${message.seq}`];
                    };
                } catch (error) {
                    figma.ui.postMessage({
                        seq: message.seq,
                        type: 'reject',
                        error: `${error}`
                    }, {
                        origin: '*'
                    });
                }
            } catch (error) {
                figma.ui.postMessage({
                    seq: message.seq,
                    type: 'reject',
                    error: `${error}`
                }, {
                    origin: '*'
                });
            }
        } else if (message.type === 'dispose') {
            observerCleanupFunctions[`${message.seq}`]?.();
        }
    }
}

export class Observable<T> {
    constructor(public emitter: (emit: {
        next: (data: T) => void,
        complete: () => void
    }) => void | (() => void)) {}
}

export function observable<T>(emitter: (emit: {
    next: (data: T) => void,
    complete: () => void
}) => void | (() => void)) {
    return new Observable<T>(emitter);
}

export function makeClient<R extends Router>(): {
    client: Client<R>
} {
    let seq = 0;

    function makeSeq() {
        return seq++;
    }

    const callbacks: {
        [seq: number]: (...args: any) => void
    } = {};

    window.addEventListener('message', (event) => {
        if (event.data.pluginMessage) {
            const message: {
                seq: number,
                type: 'accept',
                value: any
            } | {
                seq: number,
                type: 'reject',
                error: string
            } | {
                seq: number,
                type: 'complete'
            } = event.data.pluginMessage;

            if (message.type === 'accept') {
                callbacks[message.seq]({
                    type: 'accept',
                    value: message.value
                });
            } else if (message.type === 'reject') {
                callbacks[message.seq]({
                    type: 'reject',
                    error: message.error
                });
            } else if (message.type === 'complete') {
                callbacks[message.seq]({
                    type: 'complete'
                });
            }
        }
    });

    return {
        client: new Proxy({} as Client<R>, {
            get(t, key) {
                return {
                    observe: (...args: any[]) => {
                        return (handlers: {
                            onNext: (data: any) => void,
                            onError?: (error: any) => void,
                            onComplete?: () => void,
                        }) => {
                            const seq = makeSeq();

                            callbacks[seq] = (response: {type: 'accept', value: any} | {type: 'reject', error: any} | {type: 'complete'}) => {
                                if (response.type === 'accept') {

                                    handlers.onNext(response.value);

                                } else if (response.type === 'reject') {

                                    handlers.onError?.(response.error);

                                } else if (response.type === 'complete') {

                                    handlers.onComplete?.();
                                    delete callbacks[seq];

                                }
                            }

                            parent.postMessage({
                                pluginMessage: {
                                    seq: seq,
                                    type: 'observe',
                                    functionName: key,
                                    args: args
                                }
                            }, '*');

                            return () => {
                                parent.postMessage({
                                    pluginMessage: {
                                        seq: seq,
                                        type: 'dispose'
                                    }
                                }, '*');

                                handlers.onComplete?.();
                            }
                        }
                    },
                    call: (...args: any[]) => {
                        return new Promise(async (accept, reject) => {
                            const seq = makeSeq();

                            callbacks[seq] = (response: {type: 'accept', value: any} | {type: 'reject', error: any}) => {
                                if (response.type === 'accept') {
                                    accept(response.value);
                                } else {
                                    reject(response.error);
                                }

                                delete callbacks[seq];
                            }

                            parent.postMessage({
                                pluginMessage: {
                                    seq: seq,
                                    type: 'call',
                                    functionName: key,
                                    args: args
                                }
                            }, '*');
                        });
                    }
                }
            }
        })
    };
}
