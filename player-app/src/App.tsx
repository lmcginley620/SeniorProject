import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PlayerPage from "./components/PlayerJoin";
import QuestionAnswerPage from "./components/QuestionAnswerPage";
import WaitingRoom from "./components/WaitingRoom";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PlayerPage />} />
        <Route path="/question-answer" element={<QuestionAnswerPage />} />
        <Route path="/waiting-room" element={<WaitingRoom />} />

      </Routes>
    </Router>
  );
};

export default App;
