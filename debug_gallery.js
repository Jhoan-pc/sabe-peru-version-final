import { createClient } from '@supabase/supabase-js';

// Config from env (read manually in script as dotenv might not be available or tricky)
const url = 'https://xdslypbjmenthwyrarui.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY'; // This is JWT

const supabase = createClient(url, key);

async function listGallery() {
    console.log('Listing bucket content...');
    const { data, error } = await supabase.storage.from('restaurante-assets').list();
    if (error) {
        console.error('Error listing files:', error);
        return;
    }
    console.log('Found files:', data.length);
    data.forEach(f => console.log(f.name));
}

listGallery();
