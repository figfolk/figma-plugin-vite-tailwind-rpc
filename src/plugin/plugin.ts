import {makeRouter, observable, serve} from '../rpc';

const app = makeRouter({
    add: async (a: number, b: number, prefix?: string) => {
        const result = a + b;
        const text = prefix ?? 'the result of the addition is:';

        return `${text}${result}`;
    },
    randomNumbers: (min: number = 0) =>
        observable<number>((emit) => {
            const interval = setInterval(() => {
                emit.next(min + Math.random());
            }, 1000);

            return () => {
                clearInterval(interval);
            };
        }),
});

export type TApp = typeof app;

async function bootstrap() {
    figma.showUI(__html__, {
        width: 400,
        height: 400,
        title: 'Pager',
    });

    serve(app);
}

bootstrap();
