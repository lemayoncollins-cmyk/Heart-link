const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event) {
  try {
    var body = JSON.parse(event.body);
    var stkCallback = body.Body.stkCallback;

    if (stkCallback.ResultCode === 0) {
      var metadata = stkCallback.CallbackMetadata.Item;
      var amountPaid = metadata.find(function(i) { return i.Name === 'Amount'; }).Value;
      var accountRef = stkCallback.MerchantRequestID;

      var supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

      var pendingRes = await supabase.from('pending_payments').select('*').eq('merchant_request_id', stkCallback.MerchantRequestID).single();

      if (pendingRes.data) {
        var userId = pendingRes.data.user_id;
        var coinsToAdd = pendingRes.data.coins;

        var profileRes = await supabase.from('profiles').select('coins').eq('id', userId).single();
        var newBalance = (profileRes.data.coins || 0) + coinsToAdd;

        await supabase.from('profiles').update({ coins: newBalance }).eq('id', userId);
        await supabase.from('transactions').insert({ user_id: userId, amount: coinsToAdd, type: 'purchase' });
        await supabase.from('pending_payments').update({ status: 'completed' }).eq('merchant_request_id', stkCallback.MerchantRequestID);
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
