"""
Migración: Asignar client_id_number automático a clientes que no lo tienen.
Formato: Secuencial por cuenta, 2 dígitos (01, 02, 03...)
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "cotizaciones.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
        SELECT c.id, c.account_id, c.name
        FROM clients c
        WHERE c.client_id_number IS NULL OR c.client_id_number = ''
    """)
    clients_without_id = cur.fetchall()

    if not clients_without_id:
        print("No hay clientes sin client_id_number. Nada que migrar.")
        conn.close()
        return

    print(f"Encontrados {len(clients_without_id)} clientes sin ID. Procesando...")

    for client_id, account_id, client_name in clients_without_id:
        cur.execute("""
            SELECT client_id_number FROM clients
            WHERE account_id = ? AND client_id_number IS NOT NULL AND client_id_number != ''
        """, (account_id,))
        existing_ids = [row[0] for row in cur.fetchall()]

        if existing_ids:
            max_num = max(int(id_str) for id_str in existing_ids)
            next_num = max_num + 1
        else:
            next_num = 1

        new_id = f"{next_num:02d}"

        cur.execute("""
            UPDATE clients SET client_id_number = ? WHERE id = ?
        """, (new_id, client_id))

        print(f"  Cliente '{client_name}' (cuenta {account_id}) -> client_id_number: {new_id}")

    conn.commit()
    print(f"\nMigración completada. {len(clients_without_id)} clientes actualizados.")
    conn.close()

if __name__ == "__main__":
    migrate()
