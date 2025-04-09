// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import StartGamePage from './components/StartGamePage';
import HomePage from './components/HomePage';
import EnterTopicsPage from './components/EnterTopicsPage';
import QuestionPage from './components/QuestionPage';
import EndGamePage from './components/EndGamePage';
import { QuestionResults } from "./components/QuestionResults";
import LeaderboardPage from "./components/LeaderboardPage";
// import Leaderboard from "./components/leaderboard/Leaderboard";
import PageWrapper from './components/PageWrapper';

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><StartGamePage /></PageWrapper>} />
        <Route path="/lobby" element={<PageWrapper><HomePage /></PageWrapper>} />
        <Route path="/enter-topics" element={<PageWrapper><EnterTopicsPage /></PageWrapper>} />
        <Route path="/question" element={<PageWrapper><QuestionPage /></PageWrapper>} />
        <Route path="/question-result" element={<PageWrapper><QuestionResults /></PageWrapper>} />
        <Route path="/end" element={<PageWrapper><EndGamePage /></PageWrapper>} />
        <Route path="/leaderboard" element={<PageWrapper><LeaderboardPage /></PageWrapper>} />
        {/* <Route path="/leaderboard" element={<PageWrapper><Leaderboard /></PageWrapper>} /> */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
};

export default App;
