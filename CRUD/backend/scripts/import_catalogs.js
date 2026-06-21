const Database = require('better-sqlite3');
const path = require('path');
const XLSX = require('xlsx');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

const excelPath = path.join(__dirname, '../../data_excel/catalogo.xlsx');
const wb = XLSX.readFile(excelPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS dim_universidades (
    IdUniversidad INTEGER PRIMARY KEY,
    Nombre TEXT,
    Siglas TEXT,
    TipoGestion TEXT,
    Departamento TEXT,
    Provincia TEXT,
    Distrito TEXT,
    Direccion TEXT
  );

  CREATE TABLE IF NOT EXISTS dim_locales (
    IdLocal INTEGER PRIMARY KEY,
    IdUniversidad INTEGER,
    NombreUniversidad TEXT,
    CodigoLocal TEXT,
    SedePrincipal INTEGER,
    Departamento TEXT,
    Provincia TEXT,
    Distrito TEXT,
    Direccion TEXT
  );

  CREATE TABLE IF NOT EXISTS dim_indicadores (
    IdIndicador INTEGER PRIMARY KEY,
    Modelo TEXT,
    CodigoIndicador TEXT,
    CBC TEXT,
    DenomCBC TEXT,
    Etiqueta TEXT,
    Componente TEXT,
    NroIndicador INTEGER,
    DenomIndicador TEXT
  );
`);

// Clear tables if they already have data to re-import
db.exec('DELETE FROM dim_universidades; DELETE FROM dim_locales; DELETE FROM dim_indicadores;');

function importSheet(sheetName, tableName, columns) {
  if (!wb.SheetNames.includes(sheetName)) return;
  const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
  
  const insert = db.prepare(`
    INSERT INTO ${tableName} (${columns.join(', ')})
    VALUES (${columns.map(c => '@' + c).join(', ')})
  `);

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      const param = {};
      columns.forEach(col => {
        // Convert booleans to 1/0
        param[col] = typeof row[col] === 'boolean' ? (row[col] ? 1 : 0) : row[col];
      });
      insert.run(param);
    }
  });

  insertMany(data);
  console.log(`Imported ${data.length} rows into ${tableName}`);
}

importSheet('dimUniversidades', 'dim_universidades', ['IdUniversidad', 'Nombre', 'Siglas', 'TipoGestion', 'Departamento', 'Provincia', 'Distrito', 'Direccion']);
importSheet('dimLocales', 'dim_locales', ['IdLocal', 'IdUniversidad', 'NombreUniversidad', 'CodigoLocal', 'SedePrincipal', 'Departamento', 'Provincia', 'Distrito', 'Direccion']);
importSheet('dimIndicadores', 'dim_indicadores', ['IdIndicador', 'Modelo', 'CodigoIndicador', 'CBC', 'DenomCBC', 'Etiqueta', 'Componente', 'NroIndicador', 'DenomIndicador']);

console.log("Catalogs imported successfully.");
