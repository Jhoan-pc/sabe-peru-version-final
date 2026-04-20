import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xdslypbjmenthwyrarui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBucket() {
    console.log('--- Checking Storage Buckets ---');
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }

    console.log('Buckets found:', buckets.map(b => b.name));

    const galleryBucket = buckets.find(b => b.name === 'gallery' || b.name === 'galeria');

    if (galleryBucket) {
        console.log(`\n--- Listing files in '${galleryBucket.name}' ---`);
        const { data: files, error: filesError } = await supabase.storage.from(galleryBucket.name).list();
        if (filesError) {
            console.error('Error listing files:', filesError);
        } else {
            console.log(`Files found: ${files.length}`);
            files.forEach(f => console.log(`- ${f.name} (${(f.metadata.size / 1024).toFixed(2)} KB)`));
        }
    } else {
        console.log('\nBucket "gallery" or "galeria" NOT found.');
    }
}

checkBucket();
