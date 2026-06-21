<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    protected $table = 'users';

    /**
     * Roles disponibles: Admin, Registrador, Visualizador
     */
    protected $fillable = [
        'name', 'email', 'password', 'role', 'must_change_password',
    ];

    protected $hidden = ['password'];

    protected $casts = [
        'must_change_password' => 'integer',
    ];

    // Sin timestamps de Laravel (la tabla original no los tiene en el mismo formato)
    public $timestamps = false;
}
