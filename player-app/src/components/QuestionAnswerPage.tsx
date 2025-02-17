import React, { useState, useEffect } from 'react';
import '../styles/questionpage.css';

const QuestionAnswerPage: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState([
    { text: '', color: 'blue' },
    { text: '', color: 'green' },
    { text: '', color: 'yellow' },
    { text: '', color: 'red' },
  ]);

  useEffect(() => {
    async function fetchQuestion() {
      setAnswers([
        { text: 'Option 1', color: 'blue' },
        { text: 'Option 2', color: 'green' },
        { text: 'Option 3', color: 'yellow' },
        { text: 'Option 4', color: 'red' },
      ]);
    }

    fetchQuestion();
  }, []);

  return (
    <div className="question-page">
      <div className="question-box">{question}</div>
      <div className="answers center">
        {answers.map((answer, index) => (
          <button key={index} className={`answer ${answer.color}`}>
            {answer.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionAnswerPage;
