import './App.css';
import DataTable from './components/table/DataTable';
import DoubleTable from './components/DoubleTable/DoubleTable'

function App() {
  return (
    <div className="App">
      <h3>Визуализация данных, тесты</h3>
      <div className='container'>
        {/* <DataTable /> */}
        <DoubleTable />
      </div>

    </div>
  );
}

export default App;
