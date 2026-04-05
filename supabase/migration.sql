-- Add original_balance to template_debts (tracks the debt balance at the time it was first added)
alter table template_debts
  add column if not exists original_balance real not null default 0;

-- Backfill: set original_balance = starting_balance for existing debts where it is still 0
update template_debts
  set original_balance = starting_balance
  where original_balance = 0 and starting_balance > 0;

-- RPC: delete_account — lets a user delete all their own data + auth record
-- Uses security definer so it can delete from auth.users
create or replace function delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from preferences             where user_id = auth.uid();
  delete from template_bills          where user_id = auth.uid();
  delete from template_debts          where user_id = auth.uid();
  delete from cycle_bills             where user_id = auth.uid();
  delete from cycle_debt_payments     where user_id = auth.uid();
  delete from cycle_debt_snapshots    where user_id = auth.uid();
  delete from cycles                  where user_id = auth.uid();
  delete from payslips                where user_id = auth.uid();
  delete from auth.users              where id       = auth.uid();
end;
$$;

-- Grant execute to authenticated users only
revoke execute on function delete_account() from public;
grant  execute on function delete_account() to authenticated;
