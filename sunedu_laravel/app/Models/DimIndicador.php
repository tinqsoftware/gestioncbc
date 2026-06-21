<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DimIndicador extends Model
{
    protected $table      = 'dim_indicadores';
    protected $primaryKey = 'IdIndicador';
    public    $timestamps = false;

    protected $fillable = [
        'IdIndicador', 'Modelo', 'CodigoIndicador', 'CBC', 'DenomCBC',
        'Etiqueta', 'Componente', 'NroIndicador', 'DenomIndicador', 'MV', 'MedioVerificacion',
    ];
}
