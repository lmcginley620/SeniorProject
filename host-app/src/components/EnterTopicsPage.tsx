import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/entertopics.css"; // Make sure to create this file for styling

const EnterTopicsPage: React.FC = () => {
  const [topics, setTopics] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const navigate = useNavigate();

  // Function to add a topic
  const addTopic = () => {
    if (inputValue.trim() !== "") {
      setTopics([...topics, inputValue.trim()]);
      setInputValue(""); // Clear input field
    }
  };

  // Function to remove a topic
  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  // Function to start the trivia game
  const startTrivia = () => {
    if (topics.length > 0) {
      console.log("Starting game with topics:", topics);
      navigate("/question"); // Redirect to trivia game (replace with actual game page)
    }
  };

  return (
    <div className="enter-topics-container">
      <h1 className="enter-topics-title">Enter Trivia Topics</h1>
      
      <div className="topics-input-section">
        <input
          type="text"
          placeholder="Enter a topic..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="topic-input"
        />
        <button onClick={addTopic} className="add-topic-button">Add</button>
      </div>

      <div className="topics-list">
        {topics.map((topic, index) => (
          <div key={index} className="topic-item">
            {topic}
            <button onClick={() => removeTopic(index)} className="remove-topic-button">
              ✖
            </button>
          </div>
        ))}
      </div>

      <button 
        className="start-trivia-button" 
        onClick={startTrivia}
        disabled={topics.length === 0} // Disable if no topics are entered
      >
        Start Trivia
      </button>
    </div>
  );
};

export default EnterTopicsPage;
