-- FIX RLS POLICIES FOR REGISTRATION
-- Run this in your Supabase SQL Editor

-- 1. Allow any authenticated user to create a new Organization
CREATE POLICY "Enable insert for authenticated users" ON organizations
FOR INSERT TO authenticated WITH CHECK (true);

-- 2. Allow users to insert their own Profile
CREATE POLICY "Enable insert for own profile" ON profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 3. (Optional) Allow users to update their own Profile
CREATE POLICY "Enable update for own profile" ON profiles
FOR UPDATE TO authenticated USING (auth.uid() = id);
