<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DimUniversidad extends Model
{
    protected $table      = 'dim_universidades';
    protected $primaryKey = 'IdUniversidad';
    public    $timestamps = false;

    protected $fillable = [
        'IdUniversidad', 'Nombre', 'Siglas', 'TipoGestion',
        'Departamento', 'Provincia', 'Distrito', 'Direccion',
    ];

    public function files()
    {
        return $this->hasMany(File::class, 'id_universidad', 'IdUniversidad');
    }

    public function locales()
    {
        return $this->hasMany(DimLocal::class, 'IdUniversidad', 'IdUniversidad');
    }
}
