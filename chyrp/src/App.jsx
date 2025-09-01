import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState({});

  useEffect(() => {
    // We use the Fetch API to make the request to our Flask backend
    fetch("http://localhost:5000/database_test")
      .then(res => res.json())
      .then(data => {
        setData(data);
        console.log(data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>React and Flask</h1>
        <p>Message from backend: {data.message}</p>
        <p>Status: {data.status}</p>
      </header>
    </div>
  );
}

export default App;