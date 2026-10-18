# Prode Mundial 2026 — reglas y funciones

Qué hace el sistema, con los puntos y premios **tomados del proyecto real de Chebra**
(`/mnt/sdd2/cufa/clientes/chebra/prode-mundial-2026-original/`). Donde la maqueta agrega algo que el original no tenía, está marcado como **propuesta**.

## 1. Cómo se puntúa

| Resultado de tu pronóstico | Puntos | Premio |
|---|---|---|
| Marcador exacto | **10** | Código de premio canjeable en el bar |
| Ganador correcto (o empate) | **5** | — |
| No acertás | 0 | — |

- Ejemplo: resultado real 2–1. Pronóstico 2–1 → +10. Pronóstico 3–1 → +5. Pronóstico 0–1 → 0.
- El ranking es la suma de `exactos × 10 + ganadores × 5` (función `get_ranking()` del original). No hay desempate definido.
- El marcador que se evalúa es el del partido (en la maqueta, el de los 90 minutos). Los penales solo deciden quién avanza en el cuadro.
- **Propuesta (idea del dueño, 2026-10-18):** cada amigo que se suma con tu link suma **+1 punto**. No existe en el original; en la maqueta está activo (`FRIEND_POINTS` en `app.js`).

## 2. Premios y códigos

El premio no se paga con puntos: se gana un **código único** que el cliente le muestra al barman en *Mis premios*.

| Tipo | Cuándo se genera | Vence |
|---|---|---|
| `exact` — resultado exacto | Al cerrarse un partido en el que clavaste el marcador (en el original solo el exacto da código; el de "ganador" se dejó de generar, migración 011) | 3 días después de generarse |
| `thanks` — agradecimiento por participar | Lo emite el admin, no está atado a un partido (migración 028) | Fin del mes en que se generó |
| `top1` / `top2` / `top3` — podio | Al terminar el torneo, para los 3 primeros del ranking (migraciones 029 y 030) | 31 de diciembre |

- Cada código de podio es **uno solo por puesto** y vale por *uno* de los dos beneficios, a elección del cliente al canjear.
- Los nombres y descripciones de cada premio los configura el admin (tabla `app_settings`, clave `prize_config`).
- El onboarding original anuncia además un premio "ganador de la fecha" (una pinta); no encontré lógica automática que lo genere, así que hoy sería manual.
- El premio mayor es para quien tenga más puntos al terminar los 104 partidos.

## 3. Lo que ve el jugador

- **Registro e ingreso:** Google, Facebook o email y contraseña. Perfil con nombre, apellido, apodo, teléfono y fecha de nacimiento.
- **Onboarding de 4 pasos:** bienvenida, cómo se puntúa, ejemplo en vivo, premios y cómo canjear.
- **Pronósticos:** un marcador por partido. En eliminatorias, si pronosticás empate, elegís quién pasa por penales.
- **Cuadro:** de 16avos a la final y tercer puesto; los cruces se completan solos.
- **Historial:** pronósticos pasados con su resultado (exacto / ganador / sin puntos).
- **Premios:** códigos ganados, canjeados y vencidos.
- **Ranking:** tabla del bar. En la maqueta también hay grupos con tabla y triángulos de clasificación, y Ayer / Hoy / Próximos.

## 4. Panel del admin del bar

Solo entra quien tiene `is_admin = true` en su perfil. Pestañas del original:

1. **Validar** — el barman ingresa o escanea un código y el sistema dice si es válido, ya usado, vencido o inexistente; lo canjea. Muestra contadores de pendientes, vencidos y canjeados.
2. **Sync** — trae los resultados desde la API y los procesa; también permite **cargar un resultado a mano** (dos casilleros de goles y "Guardar resultado" / "Cerrar y guardar").
3. **Llave** y **Bracket** — arman el cuadro: al terminar los 72 partidos de grupos se genera el cuadro de 16avos (paso manual) y se ajustan los cruces si hace falta.
4. **Premios** — edita el nombre y la descripción de cada tipo de premio.

Los resultados también entran solos: un cron de `pg_cron` llama cada 5 minutos a la función `auto-sync`, que consulta football-data.org. Ver `api/README.md`.

## 5. Estados de un partido

`open` (se puede pronosticar) → `pending` (cerrado, espera resultado) → `synced` (resultado cargado y pronósticos evaluados). `locked` es un partido de eliminatoria sin equipos definidos.

En el original el cierre de pronósticos depende de ese estado; en la **maqueta** se muestra "Cierra al arrancar el partido" (propuesta: cierre automático por hora).

## 6. Stack del proyecto real

React 18 + Vite 5 · Supabase (PostgreSQL, Auth, RLS, RPC, Edge Functions en Deno, `pg_cron` + `pg_net`) · football-data.org · `lucide-react` · Vercel. Respaldo en `localStorage` cuando no hay Supabase configurado (modo demo).

## 7. Qué es de la maqueta y no del original

- Todo el diseño oscuro tipo Apple Sports, el cuadro con selector de fases y la vista Ayer / Hoy / Próximos.
- El bar de ejemplo (La Esquina), sus jugadores, premios y pronósticos: **ficticios**.
- El "reloj" del repaso del torneo, el modo embebido (`?embed`) y la reserva de mesa.
- El **+1 por amigo** (ver arriba) y la tarjeta "En el bar".
- Lo que **no** está en la maqueta: el panel de admin (solo está descrito acá y en la web) y el backend real.
