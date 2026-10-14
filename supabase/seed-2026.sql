-- 50 transacciones a lo largo de 2026 para un usuario.
-- Correr en Supabase: Dashboard > SQL Editor > New query > pegar y Run.
-- El SQL Editor corre como postgres y saltea RLS, así que el user_id se respeta.

insert into public.transactions (user_id, type, amount, category, description, date)
values
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 420000.00, 'Alquiler', 'Alquiler enero', '2026-01-02'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'income', 980000.00, 'Sueldo', 'Sueldo enero', '2026-01-05'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 28500.00, 'Servicios', 'Internet', '2026-01-08'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 68420.00, 'Supermercado', 'Compra semanal', '2026-01-14'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 22400.00, 'Comida', 'Cena con amigos', '2026-01-27'),

  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 420000.00, 'Alquiler', 'Alquiler febrero', '2026-02-02'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'income', 980000.00, 'Sueldo', 'Sueldo febrero', '2026-02-05'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 71250.00, 'Supermercado', 'Compra del mes', '2026-02-11'),

  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 420000.00, 'Alquiler', 'Alquiler marzo', '2026-03-02'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'income', 980000.00, 'Sueldo', 'Sueldo marzo', '2026-03-05'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 79800.00, 'Supermercado', 'Compra quincenal', '2026-03-12'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'income', 185000.00, 'Freelance', 'Diseño de landing', '2026-03-18'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 41200.00, 'Servicios', 'Luz', '2026-03-25'),

  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 420000.00, 'Alquiler', 'Alquiler abril', '2026-04-02'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'income', 1050000.00, 'Sueldo', 'Sueldo abril', '2026-04-05'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 65300.00, 'Supermercado', 'Compra semanal', '2026-04-09'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 28900.00, 'Ocio', 'Cine y salida', '2026-04-16'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 15600.00, 'Salud', 'Farmacia', '2026-04-28'),

  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 420000.00, 'Alquiler', 'Alquiler mayo', '2026-05-02'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'income', 1050000.00, 'Sueldo', 'Sueldo mayo', '2026-05-05'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 87450.00, 'Supermercado', 'Compra del mes', '2026-05-13'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 45000.00, 'Educación', 'Curso online', '2026-05-21'),

  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 420000.00, 'Alquiler', 'Alquiler junio', '2026-06-02'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'income', 1050000.00, 'Sueldo', 'Sueldo junio', '2026-06-05'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 38750.00, 'Servicios', 'Gas', '2026-06-10'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 31200.00, 'Comida', 'Almuerzo de trabajo', '2026-06-18'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 54900.00, 'Ropa', 'Zapatillas', '2026-06-29'),

  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 460000.00, 'Alquiler', 'Alquiler julio', '2026-07-02'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'income', 1050000.00, 'Sueldo', 'Sueldo julio', '2026-07-05'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 92100.00, 'Supermercado', 'Compra quincenal', '2026-07-14'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'income', 260000.00, 'Freelance', 'Ajuste de identidad visual', '2026-07-22'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 48500.00, 'Transporte', 'Nafta', '2026-07-30'),

  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 460000.00, 'Alquiler', 'Alquiler agosto', '2026-08-03'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'income', 1120000.00, 'Sueldo', 'Sueldo agosto', '2026-08-05'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 83600.00, 'Supermercado', 'Compra semanal', '2026-08-12'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 35400.00, 'Ocio', 'Recital', '2026-08-20'),

  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 460000.00, 'Alquiler', 'Alquiler septiembre', '2026-09-02'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'income', 1120000.00, 'Sueldo', 'Sueldo septiembre', '2026-09-05'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 62000.00, 'Servicios', 'Expensas', '2026-09-11'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'income', 52000.00, 'Inversiones', 'Rendimiento del mes', '2026-09-15'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 19800.00, 'Comida', 'Delivery', '2026-09-23'),

  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 460000.00, 'Alquiler', 'Alquiler octubre', '2026-10-02'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'income', 1120000.00, 'Sueldo', 'Sueldo octubre', '2026-10-05'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 77850.00, 'Supermercado', 'Compra semanal', '2026-10-08'),

  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 460000.00, 'Alquiler', 'Alquiler noviembre', '2026-11-02'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'income', 1120000.00, 'Sueldo', 'Sueldo noviembre', '2026-11-05'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 90500.00, 'Supermercado', 'Compra del mes', '2026-11-16'),

  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'expense', 460000.00, 'Alquiler', 'Alquiler diciembre', '2026-12-02'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'income', 1120000.00, 'Sueldo', 'Sueldo diciembre', '2026-12-05'),
  ('c1c6e542-61c6-4efc-a1f7-86301e0e4bf8', 'income', 75000.00, 'Regalo', 'Regalo de Navidad', '2026-12-24');
