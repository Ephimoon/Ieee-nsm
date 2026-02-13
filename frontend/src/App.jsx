import React, { useEffect } from 'react';
import Home from './pages/Home';
import BecomeMember from './pages/BM';
import Officer from './pages/Officer';
import Events from './pages/Events';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const BM_FORM_URL = process.env.REACT_APP_BM_FORM_URL?.trim();

function ExternalRedirect({ to }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return null;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>}></Route>
        <Route
          path="/bm"
          element={
            BM_FORM_URL ? <ExternalRedirect to={BM_FORM_URL} /> : <BecomeMember />
          }
        />
        <Route path="/officers" element={<Officer/>}></Route>
        <Route path="/events" element={<Events/>}></Route>
      </Routes>
    </Router>
  );
}

export default App;
