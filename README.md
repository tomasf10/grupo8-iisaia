# Gastos e Ingresos

App en Next.js (App Router) para registrar ingresos y gastos, con base de datos en Supabase y un asistente de IA (OpenRouter, modelo gratuito) que carga registros a partir de lenguaje natural.

## Setup

1. **Base de datos**: en tu proyecto de Supabase abrí *SQL Editor*, pegá el contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecutalo.
2. **Variables de entorno**: `cp .env.example .env.local` y completá:
   - `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API). La service role key solo se usa en el servidor.
   - `OPENROUTER_API_KEY` (https://openrouter.ai/keys) y opcionalmente `OPENROUTER_MODEL` (default `openrouter/free`; admite varios separados por comas como fallback).
3. `npm install && npm run dev` → http://localhost:3000

## Estructura

| Ruta | Qué hace |
| --- | --- |
| `app/page.tsx` | Totales + lista de registros (filtrar, editar, borrar) |
| `app/new`, `app/[id]/edit` | Formulario de alta / edición |
| `app/api/transactions` | `GET` (lista, `?type=income\|expense`), `POST` |
| `app/api/transactions/[id]` | `GET`, `PATCH`, `DELETE` |
| `app/api/chat` | Chatbot: interpreta el mensaje y devuelve una propuesta de registro |
| `components/ChatWidget.tsx` | Chat flotante; el usuario confirma la propuesta antes de guardarla |
| `lib/` | Cliente de Supabase, esquemas zod y acceso a datos |

## Notas

- No hay autenticación: pensado para un único usuario. RLS está activado sin policies, así que la tabla solo es accesible desde el backend.
- Los modelos gratuitos de OpenRouter tienen rate limits; si responde 429 hay que reintentar o cambiar `OPENROUTER_MODEL`.
