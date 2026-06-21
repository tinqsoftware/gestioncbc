<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class File extends Model
{
    protected $table = 'files';

    protected $fillable = [
        'internal_id', 'year', 'type_anp', 'canal_origen', 'nro_expediente_sunged',
        'id_universidad', 'tipo_gestion', 'codigo_local', 'modelo', 'cbc',
        'codigo_indicador', 'facts', 'complejidad', 'priority', 'ultima_accion',
        'fecha_ultima_accion', 'observations', 'profesional_asignado', 'acciones',
        'comprometido_plan_2026', 'entrega_informe_fecha', 'entrega_informe_estado',
        'revision_jefe_fecha', 'revision_jefe_estado', 'productos',
        'inicio_anp_documento', 'inicio_anp_fecha_notif', 'inicio_anp_dias_habiles',
        'inicio_anp_fecha_venc', 'inicio_anp_dias_venc', 'inicio_anp_alerta_i',
        'inicio_anp_alerta_ii', 'status', 'inicio_anp_observaciones',
        'seg_anp_ultima_actuacion', 'seg_anp_fecha_entrega', 'seg_anp_tipo_info',
        'seg_anp_diferencia_dias', 'seg_anp_observaciones', 'seg_anp_tipo_solicitud',
        'seg_anp_documento', 'seg_anp_fecha_notif', 'seg_anp_dias_habiles',
        'seg_anp_fecha_venc', 'seg_anp_dias_venc', 'seg_anp_alerta_i',
        'seg_anp_alerta_ii', 'seg_anp_estado', 'historial_comentarios',
    ];

    protected $casts = [
        'historial_comentarios' => 'array',
        'year'                  => 'integer',
        'id_universidad'        => 'integer',
    ];

    public function universidad()
    {
        return $this->belongsTo(DimUniversidad::class, 'id_universidad', 'IdUniversidad');
    }
}
