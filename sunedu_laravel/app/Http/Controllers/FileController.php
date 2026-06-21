<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\DimUniversidad;
use App\Models\Holiday;
use Illuminate\Http\Request;
use Carbon\Carbon;

class FileController extends Controller
{
    /**
     * GET /api/files
     * Devuelve todos los expedientes con el nombre de la universidad via JOIN.
     */
    public function index()
    {
        $files = File::with('universidad:IdUniversidad,Nombre,Siglas')
                     ->orderBy('id', 'asc')
                     ->get();

        // Inyectamos university name al nivel raíz para compatibilidad con el frontend
        $files = $files->map(function ($file) {
            $data = $file->toArray();
            $data['university'] = $file->universidad ? $file->universidad->Nombre : null;
            unset($data['universidad']);
            return $data;
        });

        return response()->json($files);
    }

    /**
     * POST /api/files
     * Crea un nuevo expediente.
     */
    public function store(Request $request)
    {
        $data = $request->all();

        // Si llega nombre de universidad pero no id, intentamos resolverlo
        if (! empty($data['university']) && empty($data['id_universidad'])) {
            $uni = DimUniversidad::where('Nombre', $data['university'])->first();
            if ($uni) {
                $data['id_universidad'] = $uni->IdUniversidad;
            }
        }

        // historial_comentarios puede llegar como array o string JSON
        if (isset($data['historial_comentarios']) && is_array($data['historial_comentarios'])) {
            $data['historial_comentarios'] = json_encode($data['historial_comentarios'], JSON_UNESCAPED_UNICODE);
        }

        $file = File::create($data);

        return response()->json([
            'message' => 'Expediente creado con éxito',
            'id'      => $file->id,
        ], 201);
    }

    /**
     * PUT /api/files/{id}
     * Actualiza un expediente.
     */
    public function update(Request $request, int $id)
    {
        $file = File::findOrFail($id);
        $data = $request->all();

        // Resolver universidad por nombre si es necesario
        if (! empty($data['university']) && empty($data['id_universidad'])) {
            $uni = DimUniversidad::where('Nombre', $data['university'])->first();
            if ($uni) {
                $data['id_universidad'] = $uni->IdUniversidad;
            }
        }

        // historial_comentarios puede llegar como array
        if (isset($data['historial_comentarios']) && is_array($data['historial_comentarios'])) {
            $data['historial_comentarios'] = json_encode($data['historial_comentarios'], JSON_UNESCAPED_UNICODE);
        }

        $file->fill($data)->save();

        return response()->json(['message' => 'Expediente actualizado con éxito']);
    }

    /**
     * DELETE /api/files/{id}
     * Elimina un expediente.
     */
    public function destroy(int $id)
    {
        $file = File::find($id);
        if (! $file) {
            return response()->json(['error' => 'Expediente no encontrado'], 404);
        }
        $file->delete();
        return response()->json(['message' => 'Expediente eliminado correctamente']);
    }

    // -------------------------------------------------------------------------
    // Helpers privados
    // -------------------------------------------------------------------------

    /**
     * Calcula la fecha de vencimiento descontando fines de semana y feriados.
     * (mismo algoritmo que el backend Express original)
     */
    public static function calcularFechaVencimiento(?string $fechaNotif, ?int $diasHabiles): ?string
    {
        if (! $fechaNotif || ! $diasHabiles) {
            return null;
        }

        $holidays = Holiday::pluck('date')
                           ->map(fn($d) => Carbon::parse($d)->format('Y-m-d'))
                           ->toArray();

        $date     = Carbon::parse($fechaNotif);
        $added    = 0;

        while ($added < $diasHabiles) {
            $date->addDay();
            $dow     = $date->dayOfWeek; // 0=Sun, 6=Sat
            $dateStr = $date->format('Y-m-d');

            if ($dow !== Carbon::SUNDAY && $dow !== Carbon::SATURDAY && ! in_array($dateStr, $holidays)) {
                $added++;
            }
        }

        return $date->format('Y-m-d');
    }
}
