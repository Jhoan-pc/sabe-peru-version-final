
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://xdslypbjmenthwyrarui.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY')

async function list() {
    const { data, error } = await supabase.storage.from('restaurante-assets').list()
    if (data) {
        console.log('Files:', data.map(f => f.name).join(', '))
    } else {
        console.error(error)
    }
}

list()
