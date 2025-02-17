import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import QuestionPage from './components/QuestionPage';
import EndGamePage from './components/EndGamePage'; // Correct import
import EnterTopicsPage from "./components/EnterTopicsPage";

import 'animate.css';

const App: React.FC = () => {
  return (
    <Router> {/* Correct BrowserRouter usage */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/question" element={<QuestionPage />} />
        <Route path="/endgame" element={<EndGamePage />} />
        <Route path="/enter-topics" element={<EnterTopicsPage />} />
      </Routes>
    </Router>
  );
};

export default App;
