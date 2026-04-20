import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://xdslypbjmenthwyrarui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY';
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
    let { data, error } = await supabase.from('site_content').select('*').in('key', ['contact_phone', 'font_title', 'font_text']);
    console.log(data);
}
run();
