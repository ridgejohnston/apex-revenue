# Lovable.dev — Referral System Integration Guide

## Overview

When someone clicks a referral link like `https://apexrevenue.works/join?ref=ABC123`,
Lovable.dev needs to:

1. Serve a `/join` page that reads the `ref` query parameter
2. Store the referral code through the signup flow
3. Pass it to Supabase on registration so the `handle_new_user` trigger records the referral automatically

## Prompt for Lovable.dev

Copy and paste the prompt below into Lovable.dev to create the `/join` page and wire up
referral tracking into your existing signup flow.

---

### Lovable.dev Prompt

```
Create a /join route that handles referral invite signups for Apex Revenue.

BEHAVIOR:
1. Read the "ref" query parameter from the URL (e.g. /join?ref=ABC123).
2. Validate the referral code by querying the Supabase "referral_codes" table:
   - SELECT code, user_id FROM referral_codes WHERE code = :ref LIMIT 1
   - If valid, show a welcome message like "You've been invited to Apex Revenue!"
   - If invalid or missing, show "Invalid invite link" with a button to go to the homepage.
3. Store the validated referral code in localStorage key "apex_referral_code" so it
   persists through the signup flow.

SIGNUP INTEGRATION:
When the user signs up (whether from the /join page or your existing signup form),
pass the referral code in the user metadata:

   const referralCode = localStorage.getItem('apex_referral_code');
   const { data, error } = await supabase.auth.signUp({
     email,
     password,
     options: {
       data: {
         referral_code: referralCode || null
       }
     }
   });

   // Clear the stored code after successful signup
   if (!error) {
     localStorage.removeItem('apex_referral_code');
   }

The Supabase database trigger "handle_new_user" will automatically look up this
referral_code in the referral_codes table and create a row in the referrals table
linking the new user to whoever referred them. No additional client-side logic needed.

PAGE DESIGN:
- Match the existing site's styling and branding
- Show the Apex Revenue logo
- Include a clear call-to-action to sign up / create an account
- If the ref code is valid, show "Referred by a friend" or similar messaging
- After signup, redirect to the main dashboard or onboarding flow

ROUTE SETUP:
- Add /join as a route in the app router
- The page should work with or without a ref parameter
- If no ref parameter, redirect to the normal signup page
```

---

## How It All Connects

```
Extension generates link        →  apexrevenue.works/join?ref=ABC123
Lovable /join page              →  validates code, stores in localStorage
User signs up                   →  code passed via auth.signUp metadata
Supabase handle_new_user()      →  trigger reads metadata, writes to referrals table
Extension / admin dashboard     →  query referrals table to see who referred whom
```

## Querying Referral Data

To see all referrals for a user (e.g. in an admin dashboard or the extension):

```sql
-- Who did user X refer?
SELECT r.*, p.id as referred_profile_id
FROM referrals r
JOIN profiles p ON p.id = r.referred_user_id
WHERE r.referrer_id = 'USER_UUID';

-- Who referred user Y?
SELECT r.*, p.id as referrer_profile_id
FROM referrals r
JOIN profiles p ON p.id = r.referrer_id
WHERE r.referred_user_id = 'USER_UUID';

-- Referral leaderboard
SELECT rc.user_id, rc.code, COUNT(r.id) as total_referrals
FROM referral_codes rc
LEFT JOIN referrals r ON r.referral_code = rc.code
GROUP BY rc.user_id, rc.code
ORDER BY total_referrals DESC;
```
