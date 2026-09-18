"""
Script de migración: agrega columnas footer_text y footer_thanks a la tabla app_settings.
SQLite no soporta ALTER TABLE DROP COLUMN en versiones antiguas, pero sí ADD COLUMN.
Este script es seguro de ejecutar varias veces (ignora si la columna ya existe).
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "cotizaciones.db")

FOOTER_TEXT_DEFAULT = "Si usted tiene alguna pregunta sobre esta cotización, por favor, póngase en contacto con nosotros"
FOOTER_THANKS_DEFAULT = "¡Gracias por hacer negocios con nosotros!"

def column_exists(cursor, table, column):
    cursor.execute(f"PRAGMA table_info({table})")
    cols = [row[1] for row in cursor.fetchall()]
    return column in cols

def migrate():
    print(f"Conectando a: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Agregar footer_text
    if not column_exists(cursor, "app_settings", "footer_text"):
        cursor.execute(
            f"ALTER TABLE app_settings ADD COLUMN footer_text TEXT DEFAULT '{FOOTER_TEXT_DEFAULT}'"
        )
        # Actualizar registros existentes con el valor por defecto
        cursor.execute(
            f"UPDATE app_settings SET footer_text = ? WHERE footer_text IS NULL",
            (FOOTER_TEXT_DEFAULT,)
        )
        print("[OK] Columna 'footer_text' agregada.")
    else:
        print("[--] Columna 'footer_text' ya existe, se omite.")

    # Agregar footer_thanks
    if not column_exists(cursor, "app_settings", "footer_thanks"):
        cursor.execute(
            f"ALTER TABLE app_settings ADD COLUMN footer_thanks TEXT DEFAULT '{FOOTER_THANKS_DEFAULT}'"
        )
        cursor.execute(
            f"UPDATE app_settings SET footer_thanks = ? WHERE footer_thanks IS NULL",
            (FOOTER_THANKS_DEFAULT,)
        )
        print("[OK] Columna 'footer_thanks' agregada.")
    else:
        print("[--] Columna 'footer_thanks' ya existe, se omite.")

    conn.commit()
    conn.close()
    print("[OK] Migracion completada exitosamente.")

if __name__ == "__main__":
    migrate()
