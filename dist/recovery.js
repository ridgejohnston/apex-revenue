var SUPABASE_URL  = 'https://ylqpsjwdsgtqdeqetkbt.supabase.co';
var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlscXBzandkc2d0cWRlcWV0a2J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDgwNjYsImV4cCI6MjA4OTAyNDA2Nn0._S3ZdFIodfPvpzy-r9CrqIkF5eSxhCW_2uylxETWYNA';

var msgEl = document.getElementById('msg');
var btn   = document.getElementById('btn');
var pw1   = document.getElementById('pw1');
var pw2   = document.getElementById('pw2');

function showMsg(text, isError) {
  msgEl.className = 'msg ' + (isError ? 'error' : 'success');
  msgEl.style.display = 'block';
  msgEl.textContent = text;
}

chrome.storage.local.get(['apexRecoveryToken'], function(r) {
  var token = r.apexRecoveryToken;

  if (!token) {
    showMsg('This reset link has already been used or has expired.', true);
    btn.disabled = true;
    return;
  }

  btn.addEventListener('click', function() {
    var p1 = pw1.value.trim();
    var p2 = pw2.value.trim();

    if (!p1 || p1.length < 8) { showMsg('Password must be at least 8 characters.', true); return; }
    if (p1 !== p2)             { showMsg('Passwords do not match.', true); return; }

    btn.disabled = true;
    btn.textContent = 'Updating…';

    fetch(SUPABASE_URL + '/auth/v1/user', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'apikey': SUPABASE_ANON
      },
      body: JSON.stringify({ password: p1 })
    })
    .then(function(res) {
      return res.json().then(function(d) { return { ok: res.ok, data: d }; });
    })
    .then(function(result) {
      if (!result.ok) throw new Error((result.data && result.data.message) || 'Update failed');
      chrome.storage.local.remove('apexRecoveryToken');
      showMsg('Password updated! You can close this tab and sign in.', false);
      btn.style.display = 'none';
    })
    .catch(function(err) {
      showMsg(err.message || 'Could not update password. Try again.', true);
      btn.disabled = false;
      btn.textContent = 'Update Password';
    });
  });
});
