const Database = require('better-sqlite3');
const path = require('path');
const XLSX = require('xlsx');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

const excelPath = path.join(__dirname, '../../data_excel/MatrizBaseRenzo.xlsx');
const wb = XLSX.readFile(excelPath);
const sheetName = wb.SheetNames[0];
const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { raw: false, dateNF: 'yyyy-mm-dd' }); // read raw false to get string dates and text

db.exec(`
  DROP TABLE IF EXISTS files;
  
  CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    internal_id TEXT,
    year INTEGER,
    type_anp TEXT,
    canal_origen TEXT,
    nro_expediente_sunged TEXT,
    id_universidad INTEGER,
    tipo_gestion TEXT,
    codigo_local TEXT,
    modelo TEXT,
    cbc TEXT,
    codigo_indicador TEXT,
    facts TEXT,
    complejidad TEXT,
    priority TEXT,
    ultima_accion TEXT,
    fecha_ultima_accion TEXT,
    observations TEXT,
    profesional_asignado TEXT,
    acciones TEXT,
    comprometido_plan_2026 TEXT,
    entrega_informe_fecha TEXT,
    entrega_informe_estado TEXT,
    revision_jefe_fecha TEXT,
    revision_jefe_estado TEXT,
    productos TEXT,
    inicio_anp_documento TEXT,
    inicio_anp_fecha_notif TEXT,
    inicio_anp_dias_habiles INTEGER,
    inicio_anp_fecha_venc TEXT,
    inicio_anp_dias_venc INTEGER,
    inicio_anp_alerta_i TEXT,
    inicio_anp_alerta_ii TEXT,
    status TEXT,
    inicio_anp_observaciones TEXT,
    seg_anp_ultima_actuacion TEXT,
    seg_anp_fecha_entrega TEXT,
    seg_anp_tipo_info TEXT,
    seg_anp_diferencia_dias INTEGER,
    seg_anp_observaciones TEXT,
    seg_anp_tipo_solicitud TEXT,
    seg_anp_documento TEXT,
    seg_anp_fecha_notif TEXT,
    seg_anp_dias_habiles INTEGER,
    seg_anp_fecha_venc TEXT,
    seg_anp_dias_venc INTEGER,
    seg_anp_alerta_i TEXT,
    seg_anp_alerta_ii TEXT,
    seg_anp_estado TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const insert = db.prepare(`
  INSERT INTO files (
    internal_id, year, type_anp, canal_origen, nro_expediente_sunged, id_universidad, tipo_gestion,
    codigo_local, modelo, cbc, codigo_indicador,
    facts, complejidad, priority, ultima_accion, fecha_ultima_accion, observations, profesional_asignado,
    acciones, comprometido_plan_2026, entrega_informe_fecha, entrega_informe_estado, revision_jefe_fecha,
    revision_jefe_estado, productos, inicio_anp_documento, inicio_anp_fecha_notif, inicio_anp_dias_habiles,
    inicio_anp_fecha_venc, inicio_anp_dias_venc, inicio_anp_alerta_i, inicio_anp_alerta_ii, status,
    inicio_anp_observaciones, seg_anp_ultima_actuacion, seg_anp_fecha_entrega, seg_anp_tipo_info,
    seg_anp_diferencia_dias, seg_anp_observaciones, seg_anp_tipo_solicitud, seg_anp_documento,
    seg_anp_fecha_notif, seg_anp_dias_habiles, seg_anp_fecha_venc, seg_anp_dias_venc, seg_anp_alerta_i,
    seg_anp_alerta_ii, seg_anp_estado
  ) VALUES (
    @internal_id, @year, @type_anp, @canal_origen, @nro_expediente_sunged, @id_universidad, @tipo_gestion,
    @codigo_local, @modelo, @cbc, @codigo_indicador,
    @facts, @complejidad, @priority, @ultima_accion, @fecha_ultima_accion, @observations, @profesional_asignado,
    @acciones, @comprometido_plan_2026, @entrega_informe_fecha, @entrega_informe_estado, @revision_jefe_fecha,
    @revision_jefe_estado, @productos, @inicio_anp_documento, @inicio_anp_fecha_notif, @inicio_anp_dias_habiles,
    @inicio_anp_fecha_venc, @inicio_anp_dias_venc, @inicio_anp_alerta_i, @inicio_anp_alerta_ii, @status,
    @inicio_anp_observaciones, @seg_anp_ultima_actuacion, @seg_anp_fecha_entrega, @seg_anp_tipo_info,
    @seg_anp_diferencia_dias, @seg_anp_observaciones, @seg_anp_tipo_solicitud, @seg_anp_documento,
    @seg_anp_fecha_notif, @seg_anp_dias_habiles, @seg_anp_fecha_venc, @seg_anp_dias_venc, @seg_anp_alerta_i,
    @seg_anp_alerta_ii, @seg_anp_estado
  )
`);

const insertMany = db.transaction((rows) => {
  for (const row of rows) {
    insert.run({
      internal_id: row['nro_expediente'] || null,
      year: row['anio'] || null,
      type_anp: row['tipo_anp'] || null,
      canal_origen: row['canal_origen'] || null,
      nro_expediente_sunged: row['nro_expediente_sunged'] || null,
      id_universidad: row['id_universidad'] || null,
      tipo_gestion: row['tipo_gestion'] || null,
      codigo_local: row['codigo_local'] || null,
      modelo: row['modelo'] || null,
      cbc: row['cbc'] || null,
      codigo_indicador: row['indicador'] || null,
      facts: row['hechos_denunciados'] || null,
      complejidad: row['complejidad'] || null,
      priority: row['prioridad'] || null,
      ultima_accion: row['ultima_accion'] || null,
      fecha_ultima_accion: row['fecha_ultima_accion'] || null,
      observations: row['comentarios'] || null,
      profesional_asignado: row['profesional_asignado'] || null,
      acciones: row['acciones'] || null,
      comprometido_plan_2026: row['comprometido_plan_2026'] || null,
      entrega_informe_fecha: row['entrega_informe_fecha'] || null,
      entrega_informe_estado: row['entrega_informe_estado'] || null,
      revision_jefe_fecha: row['revision_jefe_fecha'] || null,
      revision_jefe_estado: row['revision_jefe_estado'] || null,
      productos: row['productos'] || null,
      inicio_anp_documento: row['inicio_anp_documento'] || null,
      inicio_anp_fecha_notif: row['inicio_anp_fecha_notif'] || null,
      inicio_anp_dias_habiles: row['inicio_anp_dias_habiles'] || null,
      inicio_anp_fecha_venc: row['inicio_anp_fecha_venc'] || null,
      inicio_anp_dias_venc: row['inicio_anp_dias_venc'] || null,
      inicio_anp_alerta_i: row['inicio_anp_alerta_i'] || null,
      inicio_anp_alerta_ii: row['inicio_anp_alerta_ii'] || null,
      status: row['estado'] || null,
      inicio_anp_observaciones: row['inicio_anp_observaciones'] || null,
      seg_anp_ultima_actuacion: row['seg_anp_ultima_actuacion'] || null,
      seg_anp_fecha_entrega: row['seg_anp_fecha_entrega'] || null,
      seg_anp_tipo_info: row['seg_anp_tipo_info'] || null,
      seg_anp_diferencia_dias: row['seg_anp_diferencia_dias'] || null,
      seg_anp_observaciones: row['seg_anp_observaciones'] || null,
      seg_anp_tipo_solicitud: row['seg_anp_tipo_solicitud'] || null,
      seg_anp_documento: row['seg_anp_documento'] || null,
      seg_anp_fecha_notif: row['seg_anp_fecha_notif'] || null,
      seg_anp_dias_habiles: row['seg_anp_dias_habiles'] || null,
      seg_anp_fecha_venc: row['seg_anp_fecha_venc'] || null,
      seg_anp_dias_venc: row['seg_anp_dias_venc'] || null,
      seg_anp_alerta_i: row['seg_anp_alerta_i'] || null,
      seg_anp_alerta_ii: row['seg_anp_alerta_ii'] || null,
      seg_anp_estado: row['seg_anp_estado'] || null
    });
  }
});

insertMany(data);
console.log(`Imported ${data.length} records into files table.`);
