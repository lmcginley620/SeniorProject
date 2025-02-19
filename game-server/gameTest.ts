import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
let gameId: string;
let hostId: string;
let player1Id: string;
let player2Id: string;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('\n🏁 Starting game server tests...\n');
  
  try {
    // Test 1: Create a new game
    console.log('📋 Test 1: Creating new game...');
    hostId = 'host-123';
    const createGameResponse = await axios.post(`${API_URL}/games`, {
      hostId,
      topics: ['Science', 'History']
    });
    gameId = createGameResponse.data.id;
    console.log('✅ Game created successfully with ID:', gameId);

    // Test 2: Join game with two players
    console.log('\n📋 Test 2: Joining game with players...');
    const player1Response = await axios.post(`${API_URL}/games/${gameId}/join`, {
      playerName: 'Alice'
    });
    player1Id = player1Response.data.id;
    console.log('✅ Player 1 (Alice) joined successfully');

    const player2Response = await axios.post(`${API_URL}/games/${gameId}/join`, {
      playerName: 'Bob'
    });
    player2Id = player2Response.data.id;
    console.log('✅ Player 2 (Bob) joined successfully');

    // Test 3: Start the game
    console.log('\n📋 Test 3: Starting game...');
    await axios.post(`${API_URL}/games/${gameId}/start`, {
      hostId
    });
    console.log('✅ Game started successfully');

    // Test 4: Get current question
    console.log('\n📋 Test 4: Getting current question...');
    const questionResponse = await axios.get(`${API_URL}/games/${gameId}/questions`);
    const question = questionResponse.data;
    console.log('✅ Retrieved question:', question.text);

    // Test 5: Submit answers
    console.log('\n📋 Test 5: Submitting answers...');
    await axios.post(`${API_URL}/games/${gameId}/answer`, {
      playerId: player1Id,
      answer: question.options[question.correctAnswer]
    });
    console.log('✅ Player 1 answer submitted');

    await axios.post(`${API_URL}/games/${gameId}/answer`, {
      playerId: player2Id,
      answer: question.options[0]  // Potentially wrong answer
    });
    console.log('✅ Player 2 answer submitted');

    // Test 6: Check leaderboard
    console.log('\n📋 Test 6: Checking leaderboard...');
    const leaderboardResponse = await axios.get(`${API_URL}/games/${gameId}/leaderboard`);
    console.log('✅ Leaderboard:', leaderboardResponse.data);

    // Test 7: Move to next question
    console.log('\n📋 Test 7: Moving to next question...');
    await axios.post(`${API_URL}/games/${gameId}/next`, {
      hostId
    });
    console.log('✅ Moved to next question');

    // Test 8: End game
    console.log('\n📋 Test 8: Ending game...');
    await axios.post(`${API_URL}/games/${gameId}/end`, {
      hostId
    });
    console.log('✅ Game ended successfully');

    // Final results
    console.log('\n🎮 Final leaderboard:');
    const finalLeaderboard = await axios.get(`${API_URL}/games/${gameId}/leaderboard`);
    console.log(finalLeaderboard.data);

    console.log('\n✨ All tests completed successfully! ✨');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the tests
console.log('🔄 Starting server tests...');
console.log('Make sure the server is running on http://localhost:3000');
console.log('Press Ctrl+C to abort');

sleep(2000).then(() => {
  runTests();
});