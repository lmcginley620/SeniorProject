// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StartGamePage from './components/StartGamePage';
import HomePage from './components/HomePage';
import EnterTopicsPage from './components/EnterTopicsPage';
import QuestionPage from './components/QuestionPage';
import EndGamePage from './components/EndGamePage';
import { QuestionResults } from "./components/QuestionResults";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartGamePage />} />
        <Route path="/lobby" element={<HomePage />} />
        <Route path="/enter-topics" element={<EnterTopicsPage />} />
        <Route path="/question" element={<QuestionPage />} />
        <Route path="/end" element={<EndGamePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/question-result" element={<QuestionResults />} />
      </Routes>
    </Router>
  );
};

export default App;