import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    // In Next.js 13+ with App Router, params might be a promise or sync depending on version
    // Safely handling both
    const id = params?.id || (request as any).params?.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing zone ID' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('zones')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Zone deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
