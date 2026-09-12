exports.handler = async function(event) {
  try {
    var body = JSON.parse(event.body);
    var matchId = body.matchId;

    var res = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.DAILY_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'match-' + matchId + '-' + Date.now(),
        properties: {
          exp: Math.floor(Date.now() / 1000) + 3600,
          enable_screenshare: false,
          enable_chat: false,
          max_participants: 2
        }
      })
    });

    var data = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ url: data.url })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
