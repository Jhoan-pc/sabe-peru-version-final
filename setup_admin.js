import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xdslypbjmenthwyrarui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function setup() {
    const { data, error } = await supabase.auth.signUp({
        email: 'admin@sabeaperu.es',
        password: 'sabeaperuadmin26'
    })
    if (error) {
        console.error("SignUp error:", error.message)
    } else {
        console.log("Admin created or already exists!")
        console.log("Email: admin@sabeaperu.es")
        console.log("Pass: sabeaperuadmin26")
    }
}

setup()
