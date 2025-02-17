import React, { useEffect } from 'react';
import '../styles/questionpage.css';

const QuestionPage: React.FC = () => {
  useEffect(() => {
    document.body.classList.add('question-page-body');

    return () => {
      document.body.classList.remove('question-page-body');
    };
  }, []);

  return (
    <div className="question-page-wrapper">
      <div className="content-wrapper">
        <div className="question-number">Question #1</div>
        <div className="question-page-container">
          <div className="question-box">
            <h1>What is your favorite color?</h1>
          </div>
          <div className="answers">
            <div className="blue">Blue</div>
            <div className="green">Green</div>
            <div className="yellow">Yellow</div>
            <div className="red">Red</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionPage;
