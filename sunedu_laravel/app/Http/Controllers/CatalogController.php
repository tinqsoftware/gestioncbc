<?php

namespace App\Http\Controllers;

use App\Models\DimUniversidad;
use App\Models\DimLocal;
use App\Models\DimIndicador;
use App\Models\File;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    /**
     * GET /api/catalogs/universidades
     */
    public function universidades()
    {
        $universidades = DimUniversidad::orderBy('Nombre', 'asc')->get();
        return response()->json($universidades);
    }

    /**
     * GET /api/catalogs/locales?universidad_id=X
     */
    public function locales(Request $request)
    {
        $query = DimLocal::query();

        if ($request->filled('universidad_id')) {
            $query->where('IdUniversidad', $request->universidad_id);
        }

        return response()->json($query->get());
    }

    /**
     * GET /api/catalogs/indicadores
     */
    public function indicadores()
    {
        $indicadores = DimIndicador::all();
        return response()->json($indicadores);
    }

    /**
     * GET /api/catalogs/opciones
     * Devuelve listas únicas de canal_origen, priority y profesional_asignado
     * extraídas de los propios expedientes (autosugerencias dinámicas).
     */
    public function opciones()
    {
        $canales = File::select('canal_origen')
                       ->distinct()
                       ->whereNotNull('canal_origen')
                       ->where('canal_origen', '!=', '')
                       ->pluck('canal_origen')
                       ->map(fn($c) => ucfirst(trim($c)))
                       ->unique()
                       ->values();

        $prioridades = File::select('priority')
                           ->distinct()
                           ->whereNotNull('priority')
                           ->where('priority', '!=', '')
                           ->pluck('priority')
                           ->map(fn($p) => trim((string) $p))
                           ->unique()
                           ->sort()
                           ->values();

        $responsables = File::select('profesional_asignado')
                            ->distinct()
                            ->whereNotNull('profesional_asignado')
                            ->where('profesional_asignado', '!=', '')
                            ->pluck('profesional_asignado')
                            ->map(fn($r) => trim($r))
                            ->unique()
                            ->sort()
                            ->values();

        return response()->json([
            'canales'      => $canales,
            'prioridades'  => $prioridades,
            'responsables' => $responsables,
        ]);
    }
}
