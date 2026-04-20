const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://xdslypbjmenthwyrarui.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY'
);

async function check() {
    const { data, error } = await supabase.from('site_content').select('*');
    console.log("Error:", error);
    console.log("Data:", data);
}
check();
