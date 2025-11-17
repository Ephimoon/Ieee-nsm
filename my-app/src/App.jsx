import logo from './logo.svg';
import React from 'react';
import Home from './pages/Home';
import BecomeMember from './pages/BM';
import Officer from './pages/Officer';
import Events from './pages/Events';
import Layout from './components/Layout';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>}></Route>
        <Route path="/bm" element={<BecomeMember />} />
        <Route path="/officers" element={<Officer/>}></Route>
        <Route path="/events" element={<Events/>}></Route>
      </Routes>
    </Router>
  );
}

export default App;
