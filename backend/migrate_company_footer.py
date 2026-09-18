import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "cotizaciones.db")
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

cols = [r[1] for r in c.execute("PRAGMA table_info(company_profiles)").fetchall()]
print(f"Columnas actuales: {cols}")

if "footer_text" not in cols:
    c.execute(
        "ALTER TABLE company_profiles ADD COLUMN footer_text VARCHAR "
        "DEFAULT 'Si usted tiene alguna pregunta sobre esta cotizaci\u00f3n, por favor, p\u00f3ngase en contacto con nosotros'"
    )
    print("Columna footer_text agregada.")
else:
    print("footer_text ya existe.")

if "footer_thanks" not in cols:
    c.execute(
        "ALTER TABLE company_profiles ADD COLUMN footer_thanks VARCHAR "
        "DEFAULT '\u00a1Gracias por hacer negocios con nosotros!'"
    )
    print("Columna footer_thanks agregada.")
else:
    print("footer_thanks ya existe.")

conn.commit()
conn.close()
print("Migracion completada.")
