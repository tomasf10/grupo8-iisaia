# Vuelto

_Lo que entra, lo que sale y lo que te queda._

App en Next.js (App Router) para registrar ingresos y gastos, con base de datos en Supabase y un asistente de IA (OpenRouter, modelo gratuito) que carga registros a partir de lenguaje natural.

## Setup

1. **Base de datos**: en tu proyecto de Supabase abrí *SQL Editor*, pegá el contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecutalo. Si ya tenías la app configurada, volvé a ejecutar el script para crear la tabla de presupuestos mensuales.
2. **Auth**: en *Authentication → URL Configuration* poné como *Site URL* `http://localhost:3000` y agregá a *Redirect URLs* `http://localhost:3000/auth/callback` (y el puerto que uses, p. ej. 3001; o `http://localhost:*/auth/callback`). El proveedor *Email* viene habilitado por defecto.
3. **Variables de entorno**: `cp .env.example .env.local` y completá:
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Project Settings → API Keys; sirve la publishable `sb_publishable_...` o la anon legacy).
   - `OPENROUTER_API_KEY` (https://openrouter.ai/keys) y opcionalmente `OPENROUTER_MODEL` (default `openrouter/free`; admite varios separados por comas como fallback).
4. `npm install && npm run dev` → http://localhost:3000

## Estructura

| Ruta | Qué hace |
| --- | --- |
| `app/page.tsx` | Inicio: saludo, resumen del mes, últimos movimientos, presupuestos más comprometidos y gráficos |
| `app/presupuestos` | Presupuestos por categoría, mes por mes |
| `app/historial` | Historial agrupado por mes, con filtros y exportación a CSV |
| `app/login`, `app/auth/*` | Login con magic link, callback y logout |
| `proxy.ts` | Refresca la sesión y redirige a `/login` si no hay usuario |
| `app/new`, `app/[id]/edit` | Formulario de alta / edición |
| `app/api/transactions` | `GET` (lista, `?type=income\|expense`), `POST` |
| `app/api/transactions/[id]` | `GET`, `PATCH`, `DELETE` |
| `app/api/budgets` | `GET` por mes, `POST` (crear o actualizar), `DELETE` |
| `app/api/chat` | Chatbot: propone un registro o responde consultas sobre los movimientos |
| `components/ChatWidget.tsx` | Chat flotante; el usuario confirma la propuesta antes de guardarla |
| `lib/` | Clientes de Supabase (server/browser/proxy), esquemas zod y acceso a datos |

## Notas

- Autenticación con Supabase Auth (magic link). Cada usuario ve solo sus registros: el backend consulta con la sesión del usuario y las policies de RLS filtran por `user_id`.
- El SMTP incluido en Supabase tiene un límite bajo de emails por hora (pensado para pruebas). Para uso real configurá un SMTP propio en *Authentication → Emails*.
- El magic link hay que abrirlo en el mismo navegador donde se pidió (flujo PKCE).
- Los modelos gratuitos de OpenRouter tienen rate limits; si responde 429 hay que reintentar o cambiar `OPENROUTER_MODEL`.
