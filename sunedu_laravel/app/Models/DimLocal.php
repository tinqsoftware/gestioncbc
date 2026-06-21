<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DimLocal extends Model
{
    protected $table      = 'dim_locales';
    protected $primaryKey = 'IdLocal';
    public    $timestamps = false;

    protected $fillable = [
        'IdLocal', 'IdUniversidad', 'NombreUniversidad', 'CodigoLocal',
        'SedePrincipal', 'Departamento', 'Provincia', 'Distrito', 'Direccion',
    ];

    public function universidad()
    {
        return $this->belongsTo(DimUniversidad::class, 'IdUniversidad', 'IdUniversidad');
    }
}
