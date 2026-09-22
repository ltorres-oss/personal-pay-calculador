import os, sys, sqlite3, time, openpyxl

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'personal_pay.db')
EXCEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'Calculador', 'Calculador PPAY.xlsx')

def init_db(excel_path=EXCEL_PATH, db_path=DB_PATH):
    print(f'Iniciando base de datos SQLite en: {db_path}')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute('PRAGMA synchronous = OFF;')
    cursor.execute('PRAGMA journal_mode = MEMORY;')


    cursor.execute('''
    CREATE TABLE IF NOT EXISTS credits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agencia TEXT,
        id_comercio TEXT,
        cuil TEXT NOT NULL,
        articulo TEXT,
        nro_credito TEST,
        id_solicitud TEST,
        nro_cuota INTEGER,
        fecha_compra TEST,
        total_cuotas INTEGER,
        capital REAL DEFAULT 0,
        intereses_compensatorio REAL DEFAULT 0,
        intereses_devengado REAL DEFAULT 0,
        iva_intereses_compensatorio REAL DEFAULT 0,
        gastos REAL  DEFAULT 0,
        iva_gastos REAL  DEFAULT 0,
        punitorios REAL  DEFAULT 0,
        iva_punitorios REAL DEFAULT 0,
        importe_total REAL  DEFAULT 0,
        proximo_vto TEST,
        dias_de_mora INTEGER DEFAULT 0,
        fecha_cobro TEST,
        first_name TEXT,
        last_name TEXT,
        email TEST,
        rango_etario TEST,
        edad INTEGER,
        flag_empleado TEXT,
        city TEST,
        province TEXT,
        document_number TEXT,
        codigo_riesgo TEST,
        phone_number TEST,
        phone_number_164 TEXT,
        flag_deudor_extrapay TEST,
        tna_credito REAL  DEFAULT 0,
        comercio_de_compra TEXT,
        convergencia TEXT,
        repeaters TEXT,
        nse TEXT,
        bk TEST,
        max_dias_mora_por_cuil INTEGER,
        bk_automatico TEXT,
        tipo_producto TEST,
        fecha_asignacion TEXT,
        fecha_fin_asignacion TEST,
        n_nomina TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );''')

    cursor.execute('CREATE INDEX IF NOT EXISTS idx_credits_cuil ON credits(cuil);')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_credits_dni ON credits(document_number);')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_credits_phone ON credits(phone_number);')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS base_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        total_records INTEGER NOT NULL,
        total_unique_cuils INTEGER NOT NULL,
        imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1
    );''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS authorized_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        role TEXT NOT NULL DEFAULT 'operador',
        is_active INTEGER DEFAULT 1,
        invited_by TEST,
        invited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME
    );''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS simulation_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cuil TEXT NOT NULL,
        client_name TEST,
        operator_email TEXT,
        dias_promesa INTEGER NOT NULL,
        total_cuotas INTEGER NOT NULL,
        monto_total REAL NOT NULL,
        monto_actualizado REAL NOT NULL,
        reintegro REAL NOT NULL,
        monto_final REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );''')

    cursor.execute('SELECT count(*) FROM authorized_users')
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO authorized_users (email, name, role, is_active, invited_by)
        VALUES ('admin@personalpay.com.ar', 'Administrador Principal', 'admin', 1, 'system'),
               ('operador@personalpay.com.ar', 'Operador Demo', 'operador', 1, 'system')
        ''')
        conn.commit()

    cursor.execute('SELECT count(*) FROM credits')
    count_existing = cursor.fetchone()[0]

    if count_existing == 0 and os.path.exists(excel_path):
        print(f'Cargando registros desde {excel_path} hoja Caida Diaria AG-2...')
        start_time = time.time()

        wb = openpyxl.load_workbook(excel_path, read_only=True, data_only=True)
        ws = wb['Caida Diaria AG-2']

        batch = []
        batch_size = 5000
        total_inserted = 0

        insert_sql = '''
        INSERT INTO credits (
            agencia, id_comercio, cuil, articulo, nro_credito, id_solicitud, nro_cuota,
            fecha_compra, total_cuotas, capital, intereses_compensatorio, intereses_devengado,
            iva_intereses_compensatorio, gastos, iva_gastos, punitorios, iva_punitorios, importe_total,
            proximo_vto, dias_de_mora, fecha_cobro, first_name, last_name, email,
            rango_etario, edad, flag_empleado, city, province, document_number,
            codigo_riesgo, phone_number, phone_number_164, flag_deudor_extrapay,
            tna_credito, comercio_de_compra, convergencia, repeaters, nse, bk,
            max_dias_mora_por_cuil, bk_automatico, tipo_producto, fecha_asignacion,
            fecha_fin_asignacion, n_nomina
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        '''

        for i, row in enumerate(ws.iter_rows(min_row=2, values_only=True)):
            if not row or row[2] is None:
                continue

            def s(val):
                return str(val).strip() if val is not None else ''
            def fl(val):
                try:
                    return float(val) if val is not None else 0.0
                except:
                    return 0.0
            def it(val):
                try:
                    return int(val) if val is not None else 0
                except:
                    return 0

            cuil_clean = str(row[2]).replace('.0', '').strip() if row[2] is not None else ''
            doc_clean = str(row[29]).replace('.0', '').strip() if row[29] is not None else ''

            record = (
                s(row[0]), s(row[1]), cuil_clean, s(row[3]), s(row[4]), s(row[5]), it(row[6]),
                s(row[7]), it(row[8]), fl(row[9]), fl(row[10]), fl(row[11]),
                fl(row[12]), fl(row[13]), fl(row[14]), fl(row[15]), fl(row[16]), fl(row[17]),
                s(row[18]), it(row[19]), s(row[20]), s(row[21]), s(row[22]), s(row[23]),
                s(row[24]), it(row[25]), s(row[26]), s(row[27]), s(row[28]), doc_clean,
                s(row[30]), s(row[31]), s(row[32]), s(row[33]),
                fl(row[34]), s(row[35]), s(row[36]), s(row[37]), s(row[38]), s(row[39]),
                it(row[40]), s(row[41]), s(row[42]), s(row[43]),
                s(row[44]), s(row[45])
            )
            batch.append(record)
            if len(batch) >= batch_size:
                cursor.executemany(insert_sql, batch)
                conn.commit()
                total_inserted += len(batch)
                print(f'Insertados {total_inserted} registros...')
                batch = []

        if batch:
            cursor.executemany(insert_sql, batch)
            conn.commit()
            total_inserted += len(batch)

        cursor.execute('SELECT count(DISTINCT cuil) FROM credits')
        unique_cuils = cursor.fetchone()[0]

        cursor.execute('''
        INSERT INTO base_metadata (filename, total_records, total_unique_cuils, is_active)
        VALUES (?, ?, ?, 1)
        ''', (os.path.basename(excel_path), total_inserted, unique_cuils))
        conn.commit()

        elapsed = time.time() - start_time
        print(f'Carga completa: {total_inserted} registros ({unique_cuils} CUILs unicos) en {elapsed:.2f} segundos.')
    else:
        print(f'Base de datos ya contiene {count_existing} registros.')

    conn.close()
    print('Base de datos lista en SQLite.')

if __name__ == '__main__':
    init_db()
