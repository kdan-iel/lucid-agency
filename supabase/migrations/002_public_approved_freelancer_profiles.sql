-- Public access to minimal freelancer profile data for approved public cards

DROP POLICY IF EXISTS "Public see approved freelancer profiles" ON profiles;

CREATE POLICY "Public see approved freelancer profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM freelancers
      WHERE freelancers.user_id = profiles.user_id
        AND freelancers.status = 'approved'
    )
  );
