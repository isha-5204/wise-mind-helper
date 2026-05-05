
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own conv select" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own conv insert" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own conv update" ON public.conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own conv delete" ON public.conversations FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER conversations_updated BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_conv_user ON public.conversations(user_id, updated_at DESC);

CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own msg select" ON public.messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own msg insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own msg delete" ON public.messages FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_msg_conv ON public.messages(conversation_id, created_at);
