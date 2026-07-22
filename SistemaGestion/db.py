# db.py
import pyodbc
from contextlib import contextmanager

server = "localhost,14333"
database = "GestionActivos"
username = "sa"
password = "SqlServer@123"
driver = "ODBC Driver 17 for SQL Server"

conn_str = f"DRIVER={{{driver}}};SERVER={server};DATABASE={database};UID={username};PWD={password}"

# Conexión global (mantén por compatibilidad)
conn = pyodbc.connect(conn_str, autocommit=True)
cursor = conn.cursor()

@contextmanager
def get_cursor():
    """Context manager para obtener un cursor nuevo cada vez"""
    nueva_conn = None
    try:
        # Crear una nueva conexión para evitar conflictos
        nueva_conn = pyodbc.connect(conn_str, autocommit=False)
        nuevo_cursor = nueva_conn.cursor()
        yield nuevo_cursor
        nueva_conn.commit()
    except Exception as e:
        if nueva_conn:
            nueva_conn.rollback()
        raise e
    finally:
        if nueva_conn:
            nueva_conn.close()