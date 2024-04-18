import '@ui/styles/main.css';
import {makeClient} from '../rpc';
import type {TApp} from '@plugin/plugin';
import React, {useEffect} from 'react';

function App() {
    useEffect(() => {
        (async () => {
            const {client} = makeClient<TApp>();
            const result = await client.add.call(2, 6, 'result = ');
            console.log(result);

            const dispose = client.randomNumbers.observe(32)({
                onNext: (num) => {
                    console.log(num);
                },
                onComplete: () => console.log('complete'),
            });

            setTimeout(() => {
                dispose();
            }, 5000);
        })();
    }, []);

    return <div className="bg-red-500 h-full w-full">Tomato</div>;
}

export default App;
