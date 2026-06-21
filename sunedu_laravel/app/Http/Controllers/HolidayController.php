<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use Illuminate\Http\Request;

class HolidayController extends Controller
{
    /**
     * GET /api/holidays
     */
    public function index()
    {
        $holidays = Holiday::orderBy('date', 'asc')->get();
        return response()->json($holidays);
    }

    /**
     * POST /api/holidays
     */
    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        // Verificar duplicado (el campo es UNIQUE en la BD)
        if (Holiday::where('date', $request->date)->exists()) {
            return response()->json(['error' => 'Ese feriado ya está registrado'], 409);
        }

        $holiday = Holiday::create([
            'date'        => $request->date,
            'description' => $request->input('description'),
        ]);

        return response()->json($holiday, 201);
    }

    /**
     * DELETE /api/holidays/{id}
     */
    public function destroy(int $id)
    {
        Holiday::findOrFail($id)->delete();
        return response()->json(['message' => 'Feriado eliminado']);
    }
}
