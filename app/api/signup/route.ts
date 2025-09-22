import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, first_name, last_name, role, organization_id, organization_name } = body;

  if (!email || !password || !organization_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (role === 'admin' && !organization_name) {
    return NextResponse.json({ error: 'Organization name is required for admin signup' }, { status: 400 });
  }

  const metadata: Record<string, any> = {
    first_name,
    last_name,
    role,
    organization_id,
  };
  if (organization_name) {
    metadata.organization_name = organization_name;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data.user }, { status: 200 });
}
