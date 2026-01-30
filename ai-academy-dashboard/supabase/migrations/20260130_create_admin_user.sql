-- Create admin user for admin@example.com
-- Run this in Supabase SQL Editor

-- Step 1: Create auth user with password
-- Note: You need to set the password after running this or use Supabase Dashboard
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'admin@example.com';

  IF new_user_id IS NULL THEN
    -- Insert new user into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'admin@example.com',
      crypt('REDACTED_PASSWORD', gen_salt('bf')), -- CHANGE THIS PASSWORD!
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin User", "is_admin": true}',
      'authenticated',
      'authenticated',
      NOW(),
      NOW(),
      '',
      ''
    )
    RETURNING id INTO new_user_id;

    RAISE NOTICE 'Created new auth user with ID: %', new_user_id;
  ELSE
    RAISE NOTICE 'User already exists with ID: %', new_user_id;
  END IF;

  -- Step 2: Add to admin_users table
  INSERT INTO admin_users (user_id, email, name, is_active)
  VALUES (new_user_id, 'admin@example.com', 'Admin User', true)
  ON CONFLICT (email) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    is_active = true,
    updated_at = NOW();

  RAISE NOTICE 'Admin user configured successfully!';
END $$;

-- Verify the admin user was created
SELECT
  au.id,
  au.email,
  au.name,
  au.is_active,
  u.email as auth_email,
  u.created_at
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE au.email = 'admin@example.com';
