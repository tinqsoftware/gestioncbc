const express = require('express');
const cors = require('cors');
const db = require('./database');
const multer = require('multer');

// Ensure an admin user exists
const adminExists = db.prepare("SELECT * FROM users WHERE email = 'admin@sistema.com'").get();
if (!adminExists) {
  db.prepare("INSERT INTO users (name, email, password, role) VALUES ('Administrador', 'admin@sistema.com', 'admin123', 'Admin')").run();
  db.prepare("INSERT INTO users (name, email, password, role) VALUES ('Visualizador', 'visor@sistema.com', 'visor123', 'Visualizador')").run();
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Auth Route
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } else {
    res.status(401).json({ success: false, message: "Credenciales incorrectas" });
  }
});

// Basic Route
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Calculate Business Days function
function calculateExpirationDate(notificationDate, businessDays) {
  if (!notificationDate || !businessDays) return null;
  let date = new Date(notificationDate);
  const holidays = db.prepare('SELECT date FROM holidays').all().map(h => h.date);
  
  let daysAdded = 0;
  while (daysAdded < businessDays) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];
    
    // 0 is Sunday, 6 is Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(dateStr)) {
      daysAdded++;
    }
  }
  return date.toISOString().split('T')[0];
}

// GET all files
app.get('/api/files', (req, res) => {
  const query = `
    SELECT f.*, u.Nombre as university 
    FROM files f 
    LEFT JOIN dim_universidades u ON f.id_universidad = u.IdUniversidad
    ORDER BY f.id ASC
  `;
  const files = db.prepare(query).all();
  res.json(files);
});

// GET dashboard stats
app.get('/api/dashboard', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM files').get().count;
  const statuses = db.prepare('SELECT status, COUNT(*) as count FROM files GROUP BY status').all();
  const types = db.prepare('SELECT type_anp, COUNT(*) as count FROM files GROUP BY type_anp').all();
  
  const universities = db.prepare(`
    SELECT u.Siglas, COUNT(f.id) as count
    FROM files f
    LEFT JOIN dim_universidades u ON f.id_universidad = u.IdUniversidad
    WHERE u.Siglas IS NOT NULL
    GROUP BY u.Siglas
    ORDER BY count DESC
    LIMIT 10
  `).all();

  const byYear = db.prepare(`
    SELECT year, COUNT(*) as count FROM files
    WHERE year IS NOT NULL GROUP BY year ORDER BY year ASC
  `).all();

  const byGestion = db.prepare(`
    SELECT tipo_gestion, COUNT(*) as count FROM files
    WHERE tipo_gestion IS NOT NULL AND tipo_gestion != '' GROUP BY tipo_gestion ORDER BY count DESC
  `).all();

  const byCanal = db.prepare(`
    SELECT canal_origen, COUNT(*) as count FROM files
    WHERE canal_origen IS NOT NULL AND canal_origen != '' GROUP BY canal_origen ORDER BY count DESC
  `).all();

  res.json({ total, statuses, types, universities, byYear, byGestion, byCanal });
});

// CATALOGS
app.get('/api/catalogs/universidades', (req, res) => {
  try {
    const universidades = db.prepare('SELECT * FROM dim_universidades ORDER BY Nombre ASC').all();
    res.json(universidades);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching universities' });
  }
});

app.get('/api/catalogs/locales', (req, res) => {
  try {
    const { universidad_id } = req.query;
    let query = 'SELECT * FROM dim_locales';
    const params = [];
    if (universidad_id) {
      query += ' WHERE IdUniversidad = ?';
      params.push(universidad_id);
    }
    const locales = db.prepare(query).all(...params);
    res.json(locales);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching locales' });
  }
});

app.get('/api/catalogs/indicadores', (req, res) => {
  try {
    const indicadores = db.prepare('SELECT * FROM dim_indicadores').all();
    res.json(indicadores);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching indicadores' });
  }
});
// GET dynamic options from files table
app.get('/api/catalogs/opciones', (req, res) => {
  try {
    const canales = db.prepare("SELECT DISTINCT canal_origen FROM files WHERE canal_origen IS NOT NULL AND canal_origen != ''").all();
    const uniqueCanales = [...new Set(canales.map(r => r.canal_origen.trim().replace(/^\w/, c => c.toUpperCase())))];
    
    const prioridades = db.prepare("SELECT DISTINCT priority FROM files WHERE priority IS NOT NULL AND priority != ''").all();
    const uniquePrioridades = [...new Set(prioridades.map(r => String(r.priority).trim()))].sort();

    const responsables = db.prepare("SELECT DISTINCT profesional_asignado FROM files WHERE profesional_asignado IS NOT NULL AND profesional_asignado != ''").all();
    const uniqueResponsables = [...new Set(responsables.map(r => r.profesional_asignado.trim()))].sort();

    res.json({ canales: uniqueCanales, prioridades: uniquePrioridades, responsables: uniqueResponsables });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching opciones' });
  }
});

// HOLIDAYS (feriados) — usados para descontar días no hábiles en los plazos ANP
app.get('/api/holidays', (req, res) => {
  try {
    const holidays = db.prepare('SELECT * FROM holidays ORDER BY date ASC').all();
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener feriados' });
  }
});

app.delete('/api/files/:id', (req, res) => {
  try {
    const id = req.params.id;
    const result = db.prepare('DELETE FROM files WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }
    res.json({ message: 'Expediente eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el expediente' });
  }
});

app.post('/api/holidays', (req, res) => {
  try {
    const { date, description } = req.body;
    if (!date) return res.status(400).json({ error: 'La fecha es obligatoria' });
    const result = db.prepare('INSERT INTO holidays (date, description) VALUES (?, ?)').run(date, description || null);
    res.json({ id: result.lastInsertRowid, date, description: description || null });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Ese feriado ya está registrado' });
    }
    res.status(500).json({ error: 'Error al registrar el feriado' });
  }
});

app.delete('/api/holidays/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM holidays WHERE id = ?').run(req.params.id);
    res.json({ message: 'Feriado eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el feriado' });
  }
});

// CREATE single file
app.post('/api/files', (req, res) => {
  try {
    const b = req.body;
    const {
      internal_id, year, type_anp, university, location, indicator, priority, status, facts, observations, modelo, cbc,
      nro_expediente_sunged, canal_origen, comprometido_plan_2026, complejidad, tipo_gestion, profesional_asignado, historial_comentarios
    } = b;

    // Find university ID by name (or use provided id_universidad)
    let id_universidad = b.id_universidad || null;
    if (university && !id_universidad) {
      const uni = db.prepare('SELECT IdUniversidad FROM dim_universidades WHERE Nombre = ?').get(university);
      if (uni) id_universidad = uni.IdUniversidad;
    }

    const insert = db.prepare(`
      INSERT INTO files (
        internal_id, year, type_anp, id_universidad, tipo_gestion, codigo_local, codigo_indicador, priority, status, facts, observations, modelo, cbc,
        nro_expediente_sunged, canal_origen, comprometido_plan_2026, complejidad, profesional_asignado, historial_comentarios,
        inicio_anp_documento, inicio_anp_fecha_notif, inicio_anp_dias_habiles, inicio_anp_fecha_venc, inicio_anp_observaciones,
        seg_anp_ultima_actuacion, seg_anp_documento, seg_anp_fecha_notif, seg_anp_dias_habiles, seg_anp_fecha_venc, seg_anp_estado
      ) VALUES (
        @internal_id, @year, @type_anp, @id_universidad, @tipo_gestion, @codigo_local, @codigo_indicador, @priority, @status, @facts, @observations, @modelo, @cbc,
        @nro_expediente_sunged, @canal_origen, @comprometido_plan_2026, @complejidad, @profesional_asignado, @historial_comentarios,
        @inicio_anp_documento, @inicio_anp_fecha_notif, @inicio_anp_dias_habiles, @inicio_anp_fecha_venc, @inicio_anp_observaciones,
        @seg_anp_ultima_actuacion, @seg_anp_documento, @seg_anp_fecha_notif, @seg_anp_dias_habiles, @seg_anp_fecha_venc, @seg_anp_estado
      )
    `);

    const result = insert.run({
      internal_id, year, type_anp, id_universidad, tipo_gestion: tipo_gestion || null,
      codigo_local: b.codigo_local || location || null,
      codigo_indicador: b.codigo_indicador || indicator || null,
      priority, status, facts, observations, modelo, cbc,
      nro_expediente_sunged, canal_origen, comprometido_plan_2026, complejidad, profesional_asignado, historial_comentarios,
      inicio_anp_documento: b.inicio_anp_documento || null,
      inicio_anp_fecha_notif: b.inicio_anp_fecha_notif || null,
      inicio_anp_dias_habiles: b.inicio_anp_dias_habiles || null,
      inicio_anp_fecha_venc: b.inicio_anp_fecha_venc || null,
      inicio_anp_observaciones: b.inicio_anp_observaciones || null,
      seg_anp_ultima_actuacion: b.seg_anp_ultima_actuacion || null,
      seg_anp_documento: b.seg_anp_documento || null,
      seg_anp_fecha_notif: b.seg_anp_fecha_notif || null,
      seg_anp_dias_habiles: b.seg_anp_dias_habiles || null,
      seg_anp_fecha_venc: b.seg_anp_fecha_venc || null,
      seg_anp_estado: b.seg_anp_estado || null
    });

    res.json({ message: 'Expediente creado con éxito', id: result.lastInsertRowid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear el expediente' });
  }
});

// UPDATE single file
app.put('/api/files/:id', (req, res) => {
  try {
    const fileId = req.params.id;
    const updateData = req.body;
    
    // Auto-resolve university id if name is passed
    let id_uni = updateData.id_universidad;
    if (updateData.university && !id_uni) {
      const uni = db.prepare('SELECT IdUniversidad FROM dim_universidades WHERE Nombre = ?').get(updateData.university);
      if (uni) id_uni = uni.IdUniversidad;
    }

    const update = db.prepare(`
      UPDATE files
      SET
        year = @year,
        type_anp = @type_anp,
        canal_origen = @canal_origen,
        internal_id = @internal_id,
        nro_expediente_sunged = @nro_expediente_sunged,
        id_universidad = @id_universidad,
        tipo_gestion = @tipo_gestion,
        codigo_local = @codigo_local,
        modelo = @modelo,
        cbc = @cbc,
        codigo_indicador = @codigo_indicador,
        facts = @facts,
        complejidad = @complejidad,
        priority = @priority,
        status = @status,
        ultima_accion = @ultima_accion,
        fecha_ultima_accion = @fecha_ultima_accion,
        observations = @observations,
        profesional_asignado = @profesional_asignado,
        acciones = @acciones,
        comprometido_plan_2026 = @comprometido_plan_2026,
        entrega_informe_fecha = @entrega_informe_fecha,
        entrega_informe_estado = @entrega_informe_estado,
        revision_jefe_fecha = @revision_jefe_fecha,
        revision_jefe_estado = @revision_jefe_estado,
        productos = @productos,
        inicio_anp_documento = @inicio_anp_documento,
        inicio_anp_fecha_notif = @inicio_anp_fecha_notif,
        inicio_anp_dias_habiles = @inicio_anp_dias_habiles,
        inicio_anp_fecha_venc = @inicio_anp_fecha_venc,
        inicio_anp_observaciones = @inicio_anp_observaciones,
        seg_anp_ultima_actuacion = @seg_anp_ultima_actuacion,
        seg_anp_documento = @seg_anp_documento,
        seg_anp_fecha_notif = @seg_anp_fecha_notif,
        seg_anp_dias_habiles = @seg_anp_dias_habiles,
        seg_anp_fecha_venc = @seg_anp_fecha_venc,
        seg_anp_estado = @seg_anp_estado,
        historial_comentarios = @historial_comentarios
      WHERE id = @id
    `);

    update.run({
      id: fileId,
      year: updateData.year,
      type_anp: updateData.type_anp,
      canal_origen: updateData.canal_origen,
      internal_id: updateData.internal_id,
      nro_expediente_sunged: updateData.nro_expediente_sunged,
      id_universidad: id_uni,
      tipo_gestion: updateData.tipo_gestion,
      codigo_local: updateData.codigo_local,
      modelo: updateData.modelo,
      cbc: updateData.cbc,
      codigo_indicador: updateData.codigo_indicador,
      facts: updateData.facts,
      complejidad: updateData.complejidad,
      priority: updateData.priority,
      status: updateData.status,
      ultima_accion: updateData.ultima_accion,
      fecha_ultima_accion: updateData.fecha_ultima_accion,
      observations: updateData.observations,
      profesional_asignado: updateData.profesional_asignado,
      acciones: updateData.acciones,
      comprometido_plan_2026: updateData.comprometido_plan_2026,
      entrega_informe_fecha: updateData.entrega_informe_fecha,
      entrega_informe_estado: updateData.entrega_informe_estado,
      revision_jefe_fecha: updateData.revision_jefe_fecha,
      revision_jefe_estado: updateData.revision_jefe_estado,
      productos: updateData.productos,
      inicio_anp_documento: updateData.inicio_anp_documento,
      inicio_anp_fecha_notif: updateData.inicio_anp_fecha_notif,
      inicio_anp_dias_habiles: updateData.inicio_anp_dias_habiles,
      inicio_anp_fecha_venc: updateData.inicio_anp_fecha_venc,
      inicio_anp_observaciones: updateData.inicio_anp_observaciones,
      seg_anp_ultima_actuacion: updateData.seg_anp_ultima_actuacion,
      seg_anp_documento: updateData.seg_anp_documento,
      seg_anp_fecha_notif: updateData.seg_anp_fecha_notif,
      seg_anp_dias_habiles: updateData.seg_anp_dias_habiles,
      seg_anp_fecha_venc: updateData.seg_anp_fecha_venc,
      seg_anp_estado: updateData.seg_anp_estado,
      historial_comentarios: updateData.historial_comentarios
    });

    res.json({ message: 'Expediente actualizado con éxito' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el expediente' });
  }
});

const PORT = 3001;

// --- USER MANAGEMENT ENDPOINTS ---

app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, must_change_password FROM users').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const result = db.prepare('INSERT INTO users (name, email, password, role, must_change_password) VALUES (?, ?, ?, ?, 1)').run(name, email, password, role);
    res.json({ id: result.lastInsertRowid, message: 'Usuario creado exitosamente' });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'El correo electrónico ya está registrado' });
    }
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const { name, email, role } = req.body;
    db.prepare('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?').run(name, email, role, req.params.id);
    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'El correo electrónico ya está registrado' });
    }
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
});

app.post('/api/users/:id/reset-password', (req, res) => {
  try {
    db.prepare("UPDATE users SET password = '12345678', must_change_password = 1 WHERE id = ?").run(req.params.id);
    res.json({ message: 'Contraseña reseteada exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al resetear la contraseña' });
  }
});

app.post('/api/users/change-password', (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND password = ?').get(userId, oldPassword);
    
    if (!user) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }
    
    db.prepare('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?').run(newPassword, userId);
    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar la contraseña' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
