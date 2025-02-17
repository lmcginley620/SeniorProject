import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Lobby from './components/Lobby';
import JoinRoom from './components/JoinRoom'; // Import JoinRoom component
import Quiz from './components/Quiz';         // Import Quiz component

const App: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/join/:roomCode" element={<JoinRoom />} /> {/* Join Room page */}
      <Route path="/quiz/:roomCode" element={<Quiz />} />      {/* Quiz page */}
    </Routes>
  </Router>
);

export default App;
