-- Create the user_treasures table
create table if not exists public.user_treasures (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  collectible_id text not null,
  name_spanish text not null,
  name_english text,
  emoji text,
  found_at timestamptz default now(),
  
  -- Create a unique constraint to prevent duplicate items if desired
  -- For this game, we might allow duplicates or not. Let's enforce uniqueness for now per item type per user.
  unique(user_id, collectible_id)
);

-- Set up Row Level Security (RLS)
alter table public.user_treasures enable row level security;

-- Policy: Users can view their own treasures
create policy "Users can view their own treasures"
  on public.user_treasures for select
  using ( auth.uid() = user_id );

-- Policy: Users can insert their own treasures
create policy "Users can insert their own treasures"
  on public.user_treasures for insert
  with check ( auth.uid() = user_id );

-- Policy: Users can update their own treasures (if needed)
create policy "Users can update their own treasures"
  on public.user_treasures for update
  using ( auth.uid() = user_id );

-- Policy: Users can delete their own treasures (if needed, e.g. selling items)
create policy "Users can delete their own treasures"
  on public.user_treasures for delete
  using ( auth.uid() = user_id );
