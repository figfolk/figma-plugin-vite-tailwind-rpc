import '@ui/styles/main.css';
import {makeAutoObservable} from 'mobx';
import {observer} from 'mobx-react-lite';

const store = makeAutoObservable(
    {
        tomato: 'potato',
    },
    {},
    {},
);

const Sec = observer(function Sec() {
    const text = store.tomato;
    return <>{text}</>;
});

function App() {
    return (
        <div className="bg-red-500 h-full w-full">
            <Sec />
        </div>
    );
}

export default App;
