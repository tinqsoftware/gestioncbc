<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\DimUniversidad;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * GET /api/dashboard
     * Métricas del dashboard: totales, estados, tipos, universidades, año, gestión, canal.
     */
    public function index()
    {
        $total = File::count();

        $statuses = File::select('status', DB::raw('COUNT(*) as count'))
                        ->groupBy('status')
                        ->get();

        $types = File::select('type_anp', DB::raw('COUNT(*) as count'))
                     ->groupBy('type_anp')
                     ->get();

        $universities = DB::table('files as f')
                          ->leftJoin('dim_universidades as u', 'f.id_universidad', '=', 'u.IdUniversidad')
                          ->select('u.Siglas', DB::raw('COUNT(f.id) as count'))
                          ->whereNotNull('u.Siglas')
                          ->groupBy('u.Siglas')
                          ->orderByDesc('count')
                          ->limit(10)
                          ->get();

        $byYear = File::select('year', DB::raw('COUNT(*) as count'))
                      ->whereNotNull('year')
                      ->groupBy('year')
                      ->orderBy('year', 'asc')
                      ->get();

        $byGestion = File::select('tipo_gestion', DB::raw('COUNT(*) as count'))
                         ->whereNotNull('tipo_gestion')
                         ->where('tipo_gestion', '!=', '')
                         ->groupBy('tipo_gestion')
                         ->orderByDesc('count')
                         ->get();

        $byCanal = File::select('canal_origen', DB::raw('COUNT(*) as count'))
                       ->whereNotNull('canal_origen')
                       ->where('canal_origen', '!=', '')
                       ->groupBy('canal_origen')
                       ->orderByDesc('count')
                       ->get();

        return response()->json([
            'total'        => $total,
            'statuses'     => $statuses,
            'types'        => $types,
            'universities' => $universities,
            'byYear'       => $byYear,
            'byGestion'    => $byGestion,
            'byCanal'      => $byCanal,
        ]);
    }
}
