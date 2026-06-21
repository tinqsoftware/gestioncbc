<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\UserController;

/*
|--------------------------------------------------------------------------
| API Routes — SistemaCBC (migrado de Express/Node.js)
|--------------------------------------------------------------------------
| Las rutas son idénticas a las del backend Express original para que el
| frontend React NO necesite ningún cambio.
|--------------------------------------------------------------------------
*/

// --- Estado del servidor (health-check) ---
Route::get('/status', fn() => response()->json(['status' => 'ok', 'message' => 'Laravel API running']));

// --- Autenticación ---
Route::post('/auth/login', [AuthController::class, 'login']);

// --- Expedientes (Files) CRUD ---
Route::get('/files',         [FileController::class, 'index']);
Route::post('/files',        [FileController::class, 'store']);
Route::put('/files/{id}',    [FileController::class, 'update']);
Route::delete('/files/{id}', [FileController::class, 'destroy']);

// --- Dashboard ---
Route::get('/dashboard', [DashboardController::class, 'index']);

// --- Catálogos ---
Route::get('/catalogs/universidades', [CatalogController::class, 'universidades']);
Route::get('/catalogs/locales',       [CatalogController::class, 'locales']);
Route::get('/catalogs/indicadores',   [CatalogController::class, 'indicadores']);
Route::get('/catalogs/opciones',      [CatalogController::class, 'opciones']);

// --- Feriados ---
Route::get('/holidays',         [HolidayController::class, 'index']);
Route::post('/holidays',        [HolidayController::class, 'store']);
Route::delete('/holidays/{id}', [HolidayController::class, 'destroy']);

// --- Usuarios ---
// IMPORTANTE: la ruta change-password debe ir ANTES que /users/{id}
// para evitar que Laravel interprete "change-password" como un {id}
Route::post('/users/change-password',      [UserController::class, 'changePassword']);
Route::post('/users/{id}/reset-password',  [UserController::class, 'resetPassword']);

Route::get('/users',         [UserController::class, 'index']);
Route::post('/users',        [UserController::class, 'store']);
Route::put('/users/{id}',    [UserController::class, 'update']);
Route::delete('/users/{id}', [UserController::class, 'destroy']);
