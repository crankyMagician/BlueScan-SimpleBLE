import React from 'react';
import BluetoothScanner from './components/BluetoothScanner';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
      <div className="App">
        <header className="App-header">
          <BluetoothScanner />
        </header>
      </div>
  );
}

export default App;
