-- FIX RECURSIVE RLS BUG
-- Esegui questo script per sbloccare la lettura del profilo e dell'agenzia

-- 1. Permetti sempre all'utente di leggere il PROPRIO profilo (senza dover controllare l'agenzia prima)
CREATE POLICY "Allow users to view own profile_fix" ON profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- 2. Assicurati che le tabelle siano leggibili per l'inserimento
GRANT ALL ON TABLE transactions TO authenticated;
GRANT ALL ON TABLE profiles TO authenticated;
