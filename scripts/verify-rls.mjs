// Comprueba que la anon key NO puede escribir ni leer borradores.
// Uso: node scripts/verify-rls.mjs   (lee VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY de .env)
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
if (!url || !anonKey) {
  console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env')
  process.exit(1)
}

const supabase = createClient(url, anonKey, { auth: { persistSession: false } })
const failures = []

const insert = await supabase
  .from('products')
  .insert({ code: 'RLS-TEST', title: 'rls', category: 'variado' })
if (!insert.error) failures.push('anon pudo insertar en products')

const drafts = await supabase.from('products').select('code').eq('status', 'draft')
if (drafts.error) failures.push(`select de drafts devolvió error inesperado: ${drafts.error.message}`)
else if (drafts.data.length > 0) failures.push(`anon ve ${drafts.data.length} borradores`)

const upload = await supabase.storage
  .from('catalog')
  .upload('rls-test.txt', new Blob(['rls']), { upsert: true })
if (!upload.error) failures.push('anon pudo subir archivos al bucket catalog')

if (failures.length) {
  console.error('RLS FALLÓ:\n- ' + failures.join('\n- '))
  process.exit(1)
}
console.log('RLS OK')
