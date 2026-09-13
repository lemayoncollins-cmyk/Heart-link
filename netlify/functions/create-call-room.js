<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Heart Link - Call</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://unpkg.com/@daily-co/daily-js"></script>
<style>
  body { margin:0; font-family:-apple-system,sans-serif; background:#111; height:100vh; display:flex; flex-direction:column; }
  #callFrame { flex:1; border:none; width:100%; }
  .msg { color:white; text-align:center; padding:40px 20px; font-size:16px; }
  .startBtn { background:#ff5f8a; color:white; border:none; padding:14px 24px; border-radius:24px; font-weight:bold; font-size:16px; margin:20px auto; display:block; }
</style>
</head>
<body>
<div id="landing">
  <div class="msg" id="msg">Loading...</div>
  <button class="startBtn" id="startBtn" style="display:none;">Start Video Call</button>
</div>
<iframe id="callFrame" style="display:none;" allow="camera; microphone; fullscreen; speaker; display-capture"></iframe>

<script>
  var supabaseUrl = 'https://hqwqodmrnplswieprhms.supabase.co';
  var supabaseKey = 'sb_publishable_Wza9AqCngRXI-6GjMO6r2g_yNBJx6rY';
  var supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
  var msg = document.getElementById('msg');
  var startBtn = document.getElementById('startBtn');
  var callFrame = document.getElementById('callFrame');
  var landing = document.getElementById('landing');

  function getMatchIdFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get('match');
  }

  var matchId = getMatchIdFromUrl();

  async function init() {
    var userRes = await supabaseClient.auth.getUser();
    if (!userRes.data.user) {
      msg.textContent = 'Please log in first.';
      return;
    }
    if (!matchId) {
      msg.textContent = 'No match specified. Open this from your chat.';
      return;
    }
    msg.textContent = 'Ready to start your call.';
    startBtn.style.display = 'block';
  }

  startBtn.addEventListener('click', async function() {
    msg.textContent = 'Connecting...';
    startBtn.style.display = 'none';

    try {
      var matchRes = await supabaseClient.from('matches').select('*').eq('id', matchId).single();

      if (matchRes.error || !matchRes.data) {
        msg.textContent = 'Could not find this match.';
        startBtn.style.display = 'block';
        return;
      }

      var existingUrl = matchRes.data.call_room_url;
      var roomUrl = existingUrl;

      if (!roomUrl) {
        var res = await fetch('/.netlify/functions/create-call-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchId: matchId })
        });

        var data = await res.json();

        if (!res.ok || !data.url) {
          msg.textContent = 'Could not start the call. Please try again.';
          startBtn.style.display = 'block';
          return;
        }

        roomUrl = data.url;

        await supabaseClient
          .from('matches')
          .update({ call_room_url: roomUrl })
          .eq('id', matchId);
      }

      landing.style.display = 'none';
      callFrame.style.display = 'block';

      var callFrameInstance = window.DailyIframe.wrap(callFrame);

      var joinPromise = callFrameInstance.join({ url: roomUrl });
      var timeoutPromise = new Promise(function(_, reject) {
        setTimeout(function() { reject(new Error('Connection timed out')); }, 15000);
      });

      await Promise.race([joinPromise, timeoutPromise]);

    } catch (err) {
      landing.style.display = 'block';
      callFrame.style.display = 'none';
      msg.textContent = 'Could not connect: ' + err.message;
      startBtn.style.display = 'block';
    }
  });

  init();
</script>
</body>
</html>
