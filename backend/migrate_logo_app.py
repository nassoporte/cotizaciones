import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "cotizaciones.db")
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

cols = [r[1] for r in c.execute("PRAGMA table_info(app_settings)").fetchall()]
print(f"Columnas actuales: {cols}")

if "logo_app_url" not in cols:
    c.execute("ALTER TABLE app_settings ADD COLUMN logo_app_url VARCHAR")
    print("Columna logo_app_url agregada.")
else:
    print("logo_app_url ya existe.")

conn.commit()
conn.close()
print("Migracion completada.")
